package in.quallit.qlog.log4jappender;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import in.quallit.qlog.logtransporter.entities.Log;
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

@Plugin(name = "Log4jAppender", category = Core.CATEGORY_NAME, elementType = Appender.ELEMENT_TYPE)
public final class Log4jAppender extends AbstractAppender {

	private KafkaService kafkaService;
	protected Log4jAppender(String name, Filter filter) {
		super(name, filter, null);
		this.kafkaService = KafkaService.getInstance();
	}

	@PluginFactory
	public static Log4jAppender createAppender(@PluginAttribute("name") String name,
											   @PluginAttribute("bootstrapServers") String bootstrapServers,
											   @PluginAttribute("appName") String appName,
											   @PluginElement("Filter") Filter filter) {
		KafkaService.init(bootstrapServers, appName);
		return new Log4jAppender(name, filter);
	}

	@Override
	public void append(final LogEvent logEvent) {
		ZoneId zoneId = ZoneId.systemDefault();
		LocalDateTime logDateTime = Instant.ofEpochMilli(logEvent.getInstant().getEpochMillisecond()).atZone(zoneId).toLocalDateTime();

		String message = logEvent.getMessage().getFormattedMessage();
		if (logEvent.getThrown() != null) {
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			logEvent.getThrown().printStackTrace(pw);
			message = sw.toString(); // stack trace as a string
		}

		final Log log = new Log();
		log.setLevel(logEvent.getLevel().name());
		log.setLogTime(logDateTime);
		log.setLoggerName(logEvent.getLoggerName());
		log.setClassName(logEvent.getSource().getClassName());
		log.setMethodName(logEvent.getSource().getMethodName());
		log.setLineNumber(logEvent.getSource().getLineNumber());
		log.setMessage(message);
		log.setLogCreatedAt(LocalDateTime.now());
		this.kafkaService.sendMessage(log);
	}

}
