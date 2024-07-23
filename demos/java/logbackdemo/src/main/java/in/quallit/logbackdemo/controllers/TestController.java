package in.quallit.logbackdemo.controllers;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.stream.Stream;

/**
 * @author Jigs
 */
@RestController
@RequestMapping("/test")
public class TestController {

    private Logger logger = LogManager.getLogger(TestController.class);

    @GetMapping("/exception")
    public void testException() {
        throw new RuntimeException("This is test exception");
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> testStream() {
        return streamDummyString();
    }

    public Flux<String> streamDummyString() {
        Flux<Long> interval = Flux.interval(Duration.ofSeconds(3));
        Flux<String> events = Flux.fromStream(Stream.generate(() -> {
            LocalDateTime localDateTime = LocalDateTime.now();
            logger.info(localDateTime.toString());
            return localDateTime.toString();
        }));
        return Flux.zip(events, interval, (key, value) -> key);
    }
}
