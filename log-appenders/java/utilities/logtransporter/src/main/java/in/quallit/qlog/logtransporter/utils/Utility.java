package in.quallit.qlog.logtransporter.utils;

/**
 * @author Jigs
 */
public final class Utility {

    private Utility() {}

    public static String escapeString(String inputString) {
        if (inputString == null) {
            return "";
        }

        StringBuilder escapedString = new StringBuilder();
        for (char c : inputString.toCharArray()) {
            switch (c) {
                case '\\':
                    escapedString.append("\\\\");
                    break;
                case '"':
                    escapedString.append("\\\"");
                    break;
                case '\b':
                    escapedString.append("\\b");
                    break;
                case '\f':
                    escapedString.append("\\f");
                    break;
                case '\n':
                    escapedString.append("\\n");
                    break;
                case '\r':
                    escapedString.append("\\r");
                    break;
                case '\t':
                    escapedString.append("\\t");
                    break;
                default:
                    if (c < 32 || c > 126) {
                        escapedString.append(String.format("\\u%04x", (int) c));
                    } else {
                        escapedString.append(c);
                    }
            }
        }
        return escapedString.toString();
    }
}
