package in.quallit.qlog.logginghandler;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;
import java.util.logging.Handler;
import java.util.logging.LogRecord;

import in.quallit.qlog.logtransporter.entities.QLog;
import in.quallit.qlog.logtransporter.services.KafkaService;

public final class QLoggingHandler extends Handler {

	private static QLoggingHandler instance;
	private KafkaService kafkaService;
	private QLoggingHandler() {
		this.kafkaService = KafkaService.getInstance();
	}

	public static QLoggingHandler init(String bootstrapServers, String appName) {
		if (instance != null) {
			return instance;
		}

		KafkaService.init(bootstrapServers, appName);
		instance = new QLoggingHandler();
		return instance;
	}

	public static QLoggingHandler getInstance() {
		return instance;
	}

	@Override
	public void publish(LogRecord logEvent) {
		String message = logEvent.getMessage();
		String errStack = null;
		if (logEvent.getThrown() != null) {
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			logEvent.getThrown().printStackTrace(pw);
			errStack = sw.toString(); // stack trace as a string
		}

		final QLog log = new QLog();
		log.setLevel(logEvent.getLevel().getName());
		log.setLogTime(Instant.ofEpochMilli(logEvent.getMillis()));
		log.setLoggerName(logEvent.getLoggerName());
		log.setClassName(logEvent.getSourceClassName());
		log.setMethodName(logEvent.getSourceMethodName());
		log.setMessage(message);
		log.setMessage(errStack);
		log.setLogCreatedAt(Instant.now());
		this.kafkaService.sendMessage(log);
	}

	@Override
	public void flush() {
		//
	}

	@Override
	public void close() throws SecurityException {
		//
	}

}
