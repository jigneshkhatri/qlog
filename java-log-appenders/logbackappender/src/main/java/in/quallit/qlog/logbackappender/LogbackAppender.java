package in.quallit.qlog.logbackappender;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;

import ch.qos.logback.classic.pattern.ThrowableProxyConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.core.AppenderBase;
import ch.qos.logback.core.CoreConstants;
import in.quallit.qlog.logtransporter.entities.Log;
import in.quallit.qlog.logtransporter.services.KafkaService;

public final class LogbackAppender extends AppenderBase<ILoggingEvent> {

	private KafkaService kafkaService;
	private String kafkaHost;
	private String appName;

	private List<String> stackOptionList = Arrays.asList("full");

	@Override
	protected void append(ILoggingEvent logEvent) {
		if (this.kafkaService == null) {
			KafkaService.init(kafkaHost, appName);
			this.kafkaService = KafkaService.getInstance();
		}

		ZoneId zoneId = ZoneId.systemDefault();
		LocalDateTime logDateTime = Instant.ofEpochMilli(logEvent.getTimeStamp()).atZone(zoneId).toLocalDateTime();

		String message = logEvent.getMessage();
		IThrowableProxy proxy = logEvent.getThrowableProxy();
		if (proxy != null) {
			StringBuilder exceptionStackTrace = new StringBuilder();
			ThrowableProxyConverter converter = new ThrowableProxyConverter();
			converter.setOptionList(stackOptionList);
			converter.start();
			exceptionStackTrace.append(converter.convert(logEvent));
			exceptionStackTrace.append(CoreConstants.LINE_SEPARATOR);
			message = exceptionStackTrace.toString();
		}

		final Log log = new Log();
		log.setLevel(logEvent.getLevel().toString());
		log.setLogTime(logDateTime);
		log.setLoggerName(logEvent.getLoggerName());
		log.setClassName(logEvent.getCallerData()[0].getClassName());
		log.setMethodName(logEvent.getCallerData()[0].getMethodName());
		log.setLineNumber(logEvent.getCallerData()[0].getLineNumber());
		log.setMessage(message);
		log.setLogCreatedAt(LocalDateTime.now());
		this.kafkaService.sendMessage(log);
	}

	public String getKafkaHost() {
		return kafkaHost;
	}

	public void setKafkaHost(String kafkaHost) {
		this.kafkaHost = kafkaHost;
	}

	public String getAppName() {
		return appName;
	}

	public void setAppName(String appName) {
		this.appName = appName;
	}
}
