package in.quallit.qlog.logtransporter.serializers;

import in.quallit.qlog.logtransporter.entities.Log;
import org.apache.kafka.common.header.Headers;
import org.apache.kafka.common.serialization.Serializer;

import java.util.Map;

/**
 * @author Jigs
 */
public class LogSerializer implements Serializer<Log> {
    @Override
    public void configure(Map<String, ?> configs, boolean isKey) {
        Serializer.super.configure(configs, isKey);
    }

    @Override
    public byte[] serialize(String s, Log log) {
        return log.toString().getBytes();
    }

    @Override
    public byte[] serialize(String topic, Headers headers, Log data) {
        return data.toString().getBytes();
    }

    @Override
    public void close() {
        Serializer.super.close();
    }
}
