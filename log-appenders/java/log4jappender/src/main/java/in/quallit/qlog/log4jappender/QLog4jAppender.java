package in.quallit.qlog.log4jappender;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;

import in.quallit.qlog.logtransporter.entities.QLog;
import in.quallit.qlog.logtransporter.services.KafkaService;
import org.apache.logging.log4j.core.Appender;
import org.apache.logging.log4j.core.Core;
import org.apache.logging.log4j.core.Filter;
import org.apache.logging.log4j.core.LogEvent;
import org.apache.logging.log4j.core.appender.AbstractAppender;
import org.apache.logging.log4j.core.config.plugins.Plugin;
import org.apache.logging.log4j.core.config.plugins.PluginAttribute;
import org.apache.logging.log4j.core.config.plugins.PluginElement;
import org.apache.logging.log4j.core.config.plugins.PluginFactory;

@Plugin(name = "QLog4jAppender", category = Core.CATEGORY_NAME, elementType = Appender.ELEMENT_TYPE)
public final class QLog4jAppender extends AbstractAppender {

	private KafkaService kafkaService;
	protected QLog4jAppender(String name, Filter filter) {
		super(name, filter, null);
		this.kafkaService = KafkaService.getInstance();
	}

	@PluginFactory
	public static QLog4jAppender createAppender(@PluginAttribute("name") String name,
												@PluginAttribute("bootstrapServers") String bootstrapServers,
												@PluginAttribute("appName") String appName,
												@PluginElement("Filter") Filter filter) {
		KafkaService.init(bootstrapServers, appName);
		return new QLog4jAppender(name, filter);
	}

	@Override
	public void append(final LogEvent logEvent) {
		String message = logEvent.getMessage().getFormattedMessage();
		String className = logEvent.getSource().getClassName();
		String methodName = logEvent.getSource().getMethodName();
		Integer lineNumber = logEvent.getSource().getLineNumber();

		String errStack = null;
		if (logEvent.getThrown() != null) {
			Throwable thrown = logEvent.getThrown();
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			thrown.printStackTrace(pw);
			errStack = sw.toString(); // stack trace as a string

			className = thrown.getStackTrace()[0].getClassName();
			methodName = thrown.getStackTrace()[0].getMethodName();
			lineNumber = thrown.getStackTrace()[0].getLineNumber();
		}

		final QLog log = new QLog();
		log.setLevel(logEvent.getLevel().name());
		log.setLogTime(Instant.ofEpochMilli(logEvent.getInstant().getEpochMillisecond()));
		log.setLoggerName(logEvent.getLoggerName());
		log.setClassName(className);
		log.setMethodName(methodName);
		log.setLineNumber(lineNumber);
		log.setMessage(message);
		log.setErrStack(errStack);
		log.setLogCreatedAt(Instant.now());
		this.kafkaService.sendMessage(log);
	}

	@Override
	public void stop() {
		super.stop();
		this.kafkaService.closeProducer();
	}
}
