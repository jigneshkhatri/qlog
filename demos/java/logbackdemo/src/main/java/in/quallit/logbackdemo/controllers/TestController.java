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
import java.util.concurrent.atomic.AtomicLong;
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
        throw new RuntimeException(Thread.currentThread().getName() + " : This is test exception");
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<Long> testStream() {
        return streamDummyData();
    }

    public Flux<Long> streamDummyData() {
        Flux<Long> interval = Flux.interval(Duration.ofMillis(100));
        AtomicLong runCount = new AtomicLong(0l);
        Flux<Long> events = Flux.fromStream(Stream.generate(() -> {
            for (int i=0 ; i<100 ; i++) {
                long cnt = runCount.getAndIncrement();
                logger.info(Thread.currentThread().getName()  + " : " + cnt);
            }
            return runCount.get();
        }));
        return Flux.zip(events, interval, (key, value) -> key);
    }
}
