#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

ESP8266WebServer server(80);

// Global variables for Wi-Fi and device/user info
String ssid;
String password;
String userName;
String deviceName = "ac10001";  // Default device name

// Tries counter for connecting to the configured network
byte tries = 10;

void setup() {
  Serial.begin(115200);

  // Set the LED pin as output
  pinMode(LED_BUILTIN, OUTPUT);

  // Start the web server for configuring SSID, password, and userName
  setupAccessPoint();

  // Handle root and config requests
  server.on("/", handleRoot);
  server.on("/config", handleWiFiConfig);  // Configuration page at /config
  server.begin();

  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();

  // If the ESP8266 is connected to Wi-Fi, make an HTTP GET request
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    HTTPClient http;

    // Optionally skip SSL verification
    client.setInsecure();

    // Construct the URL using global variables
    String url = "https://smart-home-v418.onrender.com/" + userName + "/" + deviceName;

    http.begin(client, url); // Use global variables to form URL

    int httpCode = http.GET(); // Send GET request

    if (httpCode > 0) {
      // Get the response payload
      String payload = http.getString();
      Serial.println("Response payload:");
      Serial.println(payload);

      // Parse the JSON object
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, payload);

      if (!error) {
        // Extract the "state" value from the JSON
        bool state = doc["state"];
        Serial.print("AC State: ");
        Serial.println(state ? "ON" : "OFF");

        // Control the LED based on the state
        digitalWrite(LED_BUILTIN, state ? LOW : HIGH); // LOW turns the LED ON, HIGH turns it OFF
      } else {
        Serial.print("deserializeJson() failed: ");
        Serial.println(error.c_str());
      }
    } else {
      Serial.printf("Error on HTTP request: %d\n", httpCode);
    }

    http.end(); // Close the connection
  }

  delay(500); // Check every 10 seconds
}

void setupAccessPoint() {
  // Configure ESP as Access Point
  WiFi.softAP("ESP8266_Config");

  Serial.println("Access Point Started");
  Serial.print("IP Address: ");
  Serial.println(WiFi.softAPIP());
}

void handleRoot() {
  // Serve a simple HTML message for the root page
  String html = "<html><body>";
  html += "<h1>Welcome to ESP8266</h1>";
  html += "<p>Go to <a href='/config'>Configuration Page</a></p>";
  html += "</body></html>";

  server.send(200, "text/html", html);
}

void handleWiFiConfig() {
  if (server.method() == HTTP_POST) {
    // Check if all the necessary arguments are present in POST
    if (server.hasArg("ssid") && server.hasArg("password") && server.hasArg("userName")) {
      ssid = server.arg("ssid");
      password = server.arg("password");
      userName = server.arg("userName");

      // Output the updated values to the serial monitor
      Serial.println("New Wi-Fi and User Config Received:");
      Serial.println("SSID: " + ssid);
      Serial.println("Password: " + password);
      Serial.println("User Name: " + userName);

      // Respond with a JSON object containing the device name
      DynamicJsonDocument jsonResponse(1024);
      jsonResponse["deviceName"] = deviceName;

      String response;
      serializeJson(jsonResponse, response);

      // Send CORS headers
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(200, "application/json", response);

      // Connect to the new Wi-Fi
      connectToWiFi();
    } else {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.send(400, "text/plain", "Missing one or more arguments: ssid, password, userName.");
    }
  } else {
    // Serve a form for configuration at /config
    String html = "<html><body>";
    html += "<h1>WiFi and Username Setup</h1>";
    html += "<form action=\"/config\" method=\"POST\">";
    html += "SSID: <input type=\"text\" name=\"ssid\"><br>";
    html += "Password: <input type=\"text\" name=\"password\"><br>";
    html += "User Name: <input type=\"text\" name=\"userName\"><br>";
    html += "<input type=\"submit\" value=\"Submit\">";
    html += "</form></body></html>";

    // Send CORS headers
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200, "text/html", html);
  }
}

void connectToWiFi() {
  WiFi.begin(ssid.c_str(), password.c_str());
  tries = 10;

  while (--tries && WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected to Wi-Fi");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Failed to connect to Wi-Fi");
  }
}
