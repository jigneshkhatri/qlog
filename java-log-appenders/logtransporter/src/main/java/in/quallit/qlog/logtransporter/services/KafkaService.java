package in.quallit.qlog.logtransporter.services;

import in.quallit.qlog.logtransporter.entities.Log;
import in.quallit.qlog.logtransporter.serializers.LogSerializer;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.KafkaAdminClient;
import org.apache.kafka.clients.admin.ListTopicsResult;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;

import java.util.Arrays;
import java.util.Properties;
import java.util.Set;
import java.util.concurrent.ExecutionException;

/**
 * @author Jigs
 */
public class KafkaService {

    private static KafkaService instance;
    private KafkaProducer<String, Log> producer;
    private String bootstrapServers;
    private String appName;
    private String topicName;
    private KafkaService(String bootstrapServers, String appName) {
        this.bootstrapServers = bootstrapServers;
        this.appName = appName;
        this.topicName = "qlog-" + appName;

        // create topic
        this.createTopicIfRequired();

        // create producer
        this.createProducer();
    }

    public static void init(String bootstrapServers, String appName) {
        if (instance != null) {
            // instance is already created, no need to create instance again
            return;
        }

        if (bootstrapServers == null || "".equals(bootstrapServers)) {
            // throw exception
            throw new RuntimeException("bootstrapServers cannot be empty");
        }

        if (appName == null || "".equals(appName)) {
            // throw exception
            throw new RuntimeException("appName cannot be empty");
        }

        instance = new KafkaService(bootstrapServers, appName);
    }

    public static KafkaService getInstance() {
        return instance;
    }

    private void createTopicIfRequired() {
        Properties properties = new Properties();
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, this.bootstrapServers);
        AdminClient kafkaAdminClient = KafkaAdminClient.create(properties);
        ListTopicsResult topics = kafkaAdminClient.listTopics();
        try {
            Set<String> names = topics.names().get();
            if (!names.contains(this.topicName)) {
                kafkaAdminClient.createTopics(Arrays.asList(new NewTopic(this.topicName, 1, (short) 1)));
            }
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    private void createProducer() {
        // create Producer properties
        Properties properties = new Properties();
        properties.setProperty(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, this.bootstrapServers);
        properties.setProperty(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        properties.setProperty(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, LogSerializer.class.getName());

        // create the producer
        producer = new KafkaProducer<>(properties);
    }

    public void sendMessage(Log log) {
        // create a producer record
        ProducerRecord<String, Log> producerRecord = new ProducerRecord<>(this.topicName, log);

        try {
            this.producer.send(producerRecord).get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }
}
