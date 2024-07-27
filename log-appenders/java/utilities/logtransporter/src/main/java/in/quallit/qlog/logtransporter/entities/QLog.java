package in.quallit.qlog.logtransporter.entities;

import java.io.Serializable;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoField;
import java.util.Base64;

public class QLog implements Serializable {

	private String level;
	private Instant logTime;
	private String message;
	private String loggerName;
	private String className;
	private String methodName;
	private Integer lineNumber;
	private Instant logCreatedAt;

	public String getLevel() {
		return level;
	}

	public void setLevel(String level) {
		this.level = level;
	}

	public Instant getLogTime() {
		return logTime;
	}

	public void setLogTime(Instant logTime) {
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

	public Instant getLogCreatedAt() {
		return logCreatedAt;
	}

	public void setLogCreatedAt(Instant logCreatedAt) {
		this.logCreatedAt = logCreatedAt;
	}

	@Override
	public String toString() {
		String localMessage = "";
		if (this.message != null) {
			localMessage = this.message.trim();
		}

		String localLogTime = null;
		if (this.logTime != null) {
			localLogTime = this.logTime.toString();
		}

		String localLogCreatedAt = null;
		if (this.logCreatedAt != null) {
			localLogCreatedAt = this.logCreatedAt.toString();
		}

		StringBuilder stringBuilder = new StringBuilder();
		stringBuilder.append("{");
		stringBuilder.append("\"level\":\"").append(this.level).append("\"");
		stringBuilder.append(",\"logTime\":\"").append(localLogTime).append("\"");
		stringBuilder.append(",\"message\":\"").append(Base64.getEncoder().encodeToString(localMessage.getBytes(StandardCharsets.UTF_8))).append("\"");
		stringBuilder.append(",\"loggerName\":\"").append(this.loggerName).append("\"");
		stringBuilder.append(",\"className\":\"").append(this.className).append("\"");
		stringBuilder.append(",\"methodName\":\"").append(this.methodName).append("\"");
		stringBuilder.append(",\"lineNumber\":\"").append(this.lineNumber).append("\"");
		stringBuilder.append(",\"logCreatedAt\":\"").append(localLogCreatedAt).append("\"");
		stringBuilder.append("}");
		return stringBuilder.toString();
	}
}
