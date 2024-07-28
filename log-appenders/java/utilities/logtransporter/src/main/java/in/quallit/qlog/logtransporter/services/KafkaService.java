package in.quallit.qlog.logtransporter.services;

import in.quallit.qlog.logtransporter.entities.QLog;
import in.quallit.qlog.logtransporter.exceptions.ParameterValidationException;
import in.quallit.qlog.logtransporter.serializers.QLogSerializer;
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
    private KafkaProducer<String, QLog> producer;
    private String bootstrapServers;
    private String topicName;
    private KafkaService(String bootstrapServers, String appName) {
        this.bootstrapServers = bootstrapServers;
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
            throw new ParameterValidationException("Valid value for bootstrapServers parameter is required.");
        }

        if (appName == null || "".equals(appName)) {
            // throw exception
            throw new ParameterValidationException("Valid value for appName parameter is required.");
        }

        instance = new KafkaService(bootstrapServers.trim(), appName.trim());
    }

    public static KafkaService getInstance() {
        return instance;
    }

    private void createTopicIfRequired() {
        Properties properties = new Properties();
        properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, this.bootstrapServers);
        try (AdminClient kafkaAdminClient = AdminClient.create(properties)) {
            ListTopicsResult topics = kafkaAdminClient.listTopics();

            Set<String> names = topics.names().get();
            if (!names.contains(this.topicName)) {
                kafkaAdminClient.createTopics(Arrays.asList(new NewTopic(this.topicName, 1, (short) 1)));
            }
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
        }
    }

    private void createProducer() {
        // create Producer properties
        Properties properties = new Properties();
        properties.setProperty(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, this.bootstrapServers);
        properties.setProperty(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        properties.setProperty(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, QLogSerializer.class.getName());
        properties.setProperty(ProducerConfig.LINGER_MS_CONFIG, "20");
        properties.setProperty(ProducerConfig.BATCH_SIZE_CONFIG, String.valueOf(100 * 1024));

        // create the producer
        producer = new KafkaProducer<>(properties);
    }

    public void sendMessage(QLog log) {
        // create a producer record
        ProducerRecord<String, QLog> producerRecord = new ProducerRecord<>(this.topicName, log);

        try {
            this.producer.send(producerRecord).get();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
        }

    }

    public void closeProducer() {
        System.out.println("Closing producer");
        this.producer.close();
    }
}
