package in.quallit.qlog.logtransporter.entities;

import in.quallit.qlog.logtransporter.utils.Utility;

import java.io.Serializable;
import java.time.Instant;

/**
 * <p>The DTO class for the logs added by multiple log appenders to transport them to the required transport channels.</p>
 * @author jigneshkhatri
 * @since 0.0.1
 */
public class QLog implements Serializable {

	/**
	 * <p>The log level.</p>
	 * <p>Example: info, error, debug, etc.</p>
	 */
	private String level;

	/**
	 * <p>The UTC time at which log was generated.</p>
	 */
	private Instant logTime;

	/**
	 * <p>The actual log message.</p>
	 */
	private String message;

	private String errStack;

	/**
	 * <p>Name of the logger configured in logger configuration of the application.</p>
	 */
	private String loggerName;

	/**
	 * <p>The class name from where the log was generated.</p>
	 */
	private String className;

	/**
	 * <p>The method name from where the log was generated.</p>
	 */
	private String methodName;

	/**
	 * <p>The line number in the source code (class) from where the log was generated.</p>
	 */
	private Integer lineNumber;

	/**
	 * <p>The UTC time at which log was sent to the transporter from the appender.</p>
	 */
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

	public String getErrStack() {
		return errStack;
	}

	public void setErrStack(String errStack) {
		this.errStack = errStack;
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
		stringBuilder.append(",\"message\":\"").append(Utility.escapeString(this.message)).append("\"");
		if (this.errStack != null) {
			stringBuilder.append(",\"errStack\":\"").append(Utility.escapeString(this.errStack)).append("\"");
		}
		stringBuilder.append(",\"loggerName\":\"").append(this.loggerName).append("\"");
		stringBuilder.append(",\"className\":\"").append(this.className).append("\"");
		stringBuilder.append(",\"methodName\":\"").append(this.methodName).append("\"");
		stringBuilder.append(",\"lineNumber\":\"").append(this.lineNumber).append("\"");
		stringBuilder.append(",\"logCreatedAt\":\"").append(localLogCreatedAt).append("\"");
		stringBuilder.append("}");
		return stringBuilder.toString();
	}
}
