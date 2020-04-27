package ge.vakho.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PublicResourceController {

	@GetMapping("/message")
	public String message() {
		return "Public message";
	}

	@PostMapping("/message")
	public String createMessage(@RequestBody String message) {
		return String.format("Public message was created. Content: %s", message);
	}
}
