#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

int pins[]={0,1,2,4,5,12,13,14,19,18,17,16,15,26,27,25,23,22,21,32,33};
// Replace with your network credentials
const char* ssid = "RobotX club";
const char* password = "robotx2022";

// URL of the JSON data
const char* url = "https://smart-home-1.onrender.com/";

void setup() {
  Serial.begin(115200);
  for(int i=0;i<21;i++){
     pinMode(pins[i], OUTPUT);
  }
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println(" connected.");
  
}

void loop() {
    // Fetch JSON data from the URL
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(url);
    int httpResponseCode = http.GET();

    if (httpResponseCode > 0) {
      String payload = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("JSON Payload: " + payload);

      // Allocate a JsonDocument to hold the parsed JSON
      StaticJsonDocument<1024> doc;

      // Parse JSON payload
      DeserializationError error = deserializeJson(doc, payload);
      if (error) {
        Serial.print("deserializeJson() failed: ");
        Serial.println(error.f_str());
        return;
      }
      // Accessing JSON data
      // Assuming the JSON structure is known
      bool exampleValue = doc["ledState"];
      Serial.println("ledState: " + String(exampleValue));
      
      if (exampleValue == 0) {
          for(int i=0;i<21;i++){
     digitalWrite(pins[i],LOW);
  }
      } else if (exampleValue==1){
  for(int i=0;i<21;i++){
     digitalWrite(pins[i],HIGH);
  }
      }
    } else {
      Serial.println("Error on HTTP request");
    }
    http.end(); // Free resources
  } else {
    Serial.println("WiFi not connected");
  }
}