# Qlog
Qlog is a cloud-based log explorer that can be effortlessly deployed on-premises and is compatible with a wide range of loggers across different tech stacks. This solution will simplify and unify log searches, enabling developers to access logs from multiple servers (staging, production, etc.) without direct server access, hassle-free.

## How does it work?
- Qlog uses a Kafka queue in its centre to gather the logs from different appenders and route them to MongoDB.
  - The custom appenders are created for most of the loggers, which can be configured in our applications. These appenders will then pass the logs to the Kafka queue via log transports.
  - For any log added to the Kafka queue, there are consumers in NodeJS Express, that would be listening to the queue for the log messages, and writing them to the MongoDB.
- _WIP_ - The logs from any application can be streamed in real-time via a NodeJS Express API. These streamed logs are viewed on the UI via an Angular application.
- _WIP_ - There is also a feature to search for the logs by different parameters like date/time, free text, class names, etc. on the UI.

## Components:
- java-appenders: Custom appenders/handlers for different loggers in Java
  - log4jappender: Appender for `Log4j`
  - logginghandler: Handler for `java.util.Logging`
  - logtransporter: Common log transporter, used by all the appenders/handlers to send the logs on the Kafka queue
- web:
  - api: NodeJS Express application
    - It is connected with the Kafka queue and consumes all the messages (logs) sent on the Kafka queue by the log appenders, and saves them in MongoDB.
    - It also serves the APIs for streaming the logs on-demand in real-time directly from the Kafka queue itself.
  - frontend:
    - _WIP_ - User interface to view the streamed logs in real-time, as well as search for the logs.
   
## TODO:
- Much of the work is still pending around developing different loggers in different programming languages.
- Publish the log appenders to the respective public repositories as per their technologies.
- Streamlining the APIs and making up a decent UI.
- Adding an authentication layer in the API.
- Containerize the web components, and kafka and spin them up with very ease using the single `docker-compose.yaml`.
- Performance improvements and benchmarking.
- Documenting the code.
- Including README for each of the component.
