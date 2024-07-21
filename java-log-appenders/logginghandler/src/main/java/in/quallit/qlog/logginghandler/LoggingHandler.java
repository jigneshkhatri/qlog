package in.quallit.qlog.logginghandler;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.logging.Handler;
import java.util.logging.LogRecord;

import in.quallit.qlog.logtransporter.entities.Log;
import in.quallit.qlog.logtransporter.services.KafkaService;

public final class LoggingHandler extends Handler {

	private static LoggingHandler instance;
	private KafkaService kafkaService;
	private LoggingHandler() {
		this.kafkaService = KafkaService.getInstance();
	}

	public static LoggingHandler init(String bootstrapServers, String appName) {
		if (instance != null) {
			return instance;
		}

		KafkaService.init(bootstrapServers, appName);
		instance = new LoggingHandler();
		return instance;
	}

	public static LoggingHandler getInstance() {
		return instance;
	}

	@Override
	public void publish(LogRecord record) {
		ZoneId zoneId = ZoneId.systemDefault();
		LocalDateTime logDateTime = Instant.ofEpochMilli(record.getMillis()).atZone(zoneId).toLocalDateTime();

		String message = record.getMessage();
		if (record.getThrown() != null) {
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			record.getThrown().printStackTrace(pw);
			message = sw.toString(); // stack trace as a string
		}

		final Log log = new Log();
		log.setLevel(record.getLevel().getName());
		log.setLogTime(logDateTime);
		log.setLoggerName(record.getLoggerName());
		log.setClassName(record.getSourceClassName());
		log.setMethodName(record.getSourceMethodName());
		log.setMessage(message);
		log.setLogCreatedAt(LocalDateTime.now());
		this.kafkaService.sendMessage(log);
	}

	@Override
	public void flush() {
	}

	@Override
	public void close() throws SecurityException {
	}

}
