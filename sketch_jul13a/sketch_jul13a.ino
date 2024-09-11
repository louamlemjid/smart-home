#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Replace with your network credentials
const char *ssid = "Arduino-AP";
const char *password = "12345678";

WebServer server(80);
String userName;
const char *deviceName = "ac10000";

// JSON object fields
bool deviceState;
int deviceTemperature;
String deviceMode;

void handleRoot() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/html", "Configure WiFi using /config?ssid=your_ssid&password=your_password&userName=your_userName");
}

void handleConfig() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  if (server.hasArg("ssid") && server.hasArg("password") && server.hasArg("userName")) {
    String newSSID = server.arg("ssid");
    String newPassword = server.arg("password");
    userName = server.arg("userName");

    // Save the new WiFi credentials and user name
    WiFi.begin(newSSID.c_str(), newPassword.c_str());

    // Wait for connection
    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < 20) {
      delay(500);
      retries++;
      Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("Connected to WiFi!");
      Serial.print("User Name: ");
      Serial.println(userName);
      Serial.print("Device Name: ");
      Serial.println(deviceName);

      // Prepare JSON response
      StaticJsonDocument<200> doc;
      doc["message"] = "Connected to WiFi";
      doc["deviceName"] = deviceName;

      String response;
      serializeJson(doc, response);

      server.send(200, "application/json", response);
    } else {
      Serial.println("Failed to connect to WiFi");
      server.send(200, "text/html", "Failed to connect to WiFi");
    }
  } else {
    server.send(200, "text/html", "Configure WiFi using /config?ssid=your_ssid&password=your_password&userName=your_userName");
  }
}

void handleNotFound() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(404, "text/plain", "Not Found");
}

void fetchJson() {
  if ((WiFi.status() == WL_CONNECTED)) { // Check the current connection status
    HTTPClient http;
    String url = "https://smart-home-1.onrender.com/" + userName + "/" + deviceName;
    http.begin(url); // Specify the URL
    int httpCode = http.GET(); // Make the request

    if (httpCode > 0) { // Check for the returning code
      String payload = http.getString();
      Serial.println(payload);

      // Parse the JSON
      StaticJsonDocument<500> doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print(F("deserializeJson() failed: "));
        Serial.println(error.f_str());
        return;
      }

      // Extract temperature, mode, and state
      deviceState = doc["state"];             // Boolean: Device state
      deviceTemperature = doc["temperature"]; // Integer: Device temperature
      deviceMode = doc["mode"].as<String>();  // String: Device mode

      // Print the values to the Serial Monitor
      Serial.print("Device State: ");
      Serial.println(deviceState ? "On" : "Off");

      Serial.print("Temperature: ");
      Serial.println(deviceTemperature);

      Serial.print("Mode: ");
      Serial.println(deviceMode);

    } else {
      Serial.println("Error on HTTP request");
    }
    http.end(); // Free the resources
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println();

  // Set the Arduino as an access point
  WiFi.softAP(ssid, password);

  IPAddress IP = WiFi.softAPIP();
  Serial.print("AP IP address: ");
  Serial.println(IP);

  // Define the web server routes
  server.on("/", handleRoot);
  server.on("/config", handleConfig);

  // Handle CORS preflight requests
  server.on("/config", HTTP_OPTIONS, []() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(204);
  });

  // Handle not found
  server.onNotFound(handleNotFound);

  // Start the server
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
  fetchJson(); // Fetch JSON from the server periodically
}
