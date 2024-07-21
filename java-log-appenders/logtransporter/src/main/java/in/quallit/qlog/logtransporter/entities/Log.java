package in.quallit.qlog.logtransporter.entities;

import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

public class Log implements Serializable {

	private String level;
	private LocalDateTime logTime;
	private String message;
	private String loggerName;
	private String className;
	private String methodName;
	private Integer lineNumber;
	private LocalDateTime logCreatedAt;

	public String getLevel() {
		return level;
	}

	public void setLevel(String level) {
		this.level = level;
	}

	public LocalDateTime getLogTime() {
		return logTime;
	}

	public void setLogTime(LocalDateTime logTime) {
		this.logTime = logTime;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public String getLoggerName() {
		return loggerName;
	}

	public void setLoggerName(String loggerName) {
		this.loggerName = loggerName;
	}

	public String getClassName() {
		return className;
	}

	public void setClassName(String className) {
		this.className = className;
	}

	public String getMethodName() {
		return methodName;
	}

	public void setMethodName(String methodName) {
		this.methodName = methodName;
	}

	public Integer getLineNumber() {
		return lineNumber;
	}

	public void setLineNumber(Integer lineNumber) {
		this.lineNumber = lineNumber;
	}

	public LocalDateTime getLogCreatedAt() {
		return logCreatedAt;
	}

	public void setLogCreatedAt(LocalDateTime logCreatedAt) {
		this.logCreatedAt = logCreatedAt;
	}

	@Override
	public String toString() {
		DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.append("{");
		stringBuilder.append("\"level\":\"").append(level).append("\"");
		stringBuilder.append(",\"logTime\":\"").append(dateTimeFormatter.format(logTime)).append("\"");
		stringBuilder.append(",\"message\":\"").append(Base64.getEncoder().encodeToString(message.getBytes(StandardCharsets.UTF_8))).append("\"");
		stringBuilder.append(",\"loggerName\":\"").append(loggerName).append("\"");
		stringBuilder.append(",\"className\":\"").append(className).append("\"");
		stringBuilder.append(",\"methodName\":\"").append(methodName).append("\"");
		stringBuilder.append(",\"lineNumber\":\"").append(lineNumber).append("\"");
		stringBuilder.append(",\"logCreatedAt\":\"").append(dateTimeFormatter.format(logCreatedAt)).append("\"");
		stringBuilder.append("}");
		return stringBuilder.toString();
	}
}
