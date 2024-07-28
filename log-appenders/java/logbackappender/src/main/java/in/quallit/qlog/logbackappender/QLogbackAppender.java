package in.quallit.qlog.logbackappender;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import ch.qos.logback.classic.pattern.ThrowableProxyConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.core.AppenderBase;
import ch.qos.logback.core.CoreConstants;
import in.quallit.qlog.logtransporter.entities.QLog;
import in.quallit.qlog.logtransporter.services.KafkaService;

public final class QLogbackAppender extends AppenderBase<ILoggingEvent> {

	private KafkaService kafkaService;
	private String bootstrapServers;
	private String appName;

	private List<String> stackOptionList = Arrays.asList("full");

	@Override
	protected void append(ILoggingEvent logEvent) {
		if (this.kafkaService == null) {
			KafkaService.init(this.bootstrapServers, this.appName);
			this.kafkaService = KafkaService.getInstance();
		}

		String message = logEvent.getMessage();
		String className = logEvent.getCallerData()[0].getClassName();
		String methodName = logEvent.getCallerData()[0].getMethodName();
		Integer lineNumber = logEvent.getCallerData()[0].getLineNumber();

		IThrowableProxy proxy = logEvent.getThrowableProxy();
		if (proxy != null) {
			StringBuilder exceptionStackTrace = new StringBuilder();
			ThrowableProxyConverter converter = new ThrowableProxyConverter();
			converter.setOptionList(stackOptionList);
			converter.start();
			exceptionStackTrace.append(converter.convert(logEvent));
			exceptionStackTrace.append(CoreConstants.LINE_SEPARATOR);
			message = exceptionStackTrace.toString();

			className = proxy.getStackTraceElementProxyArray()[0].getStackTraceElement().getClassName();
			methodName = proxy.getStackTraceElementProxyArray()[0].getStackTraceElement().getMethodName();
			lineNumber = proxy.getStackTraceElementProxyArray()[0].getStackTraceElement().getLineNumber();
		}

		final QLog log = new QLog();
		log.setLevel(logEvent.getLevel().toString());
		log.setLogTime(Instant.ofEpochMilli(logEvent.getTimeStamp()));
		log.setLoggerName(logEvent.getLoggerName());
		log.setClassName(className);
		log.setMethodName(methodName);
		log.setLineNumber(lineNumber);
		log.setMessage(message);
		log.setLogCreatedAt(Instant.now());
		this.kafkaService.sendMessage(log);
	}

	@Override
	public void stop() {
		super.stop();
		if (this.kafkaService != null) {
			this.kafkaService.closeProducer();
		}
	}

	public String getBootstrapServers() {
		return bootstrapServers;
	}

	public void setBootstrapServers(String bootstrapServers) {
		this.bootstrapServers = bootstrapServers;
	}

	public String getAppName() {
		return appName;
	}

	public void setAppName(String appName) {
		this.appName = appName;
	}
}
