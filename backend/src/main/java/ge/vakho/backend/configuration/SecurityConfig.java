package ge.vakho.backend.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.annotation.web.configurers.oauth2.server.resource.OAuth2ResourceServerConfigurer;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

//	@Value("${spring.security.oauth2.resourceserver.opaquetoken.introspection-uri}")
//	String introspectionUri;
//	
//	@Value("${spring.security.oauth2.resourceserver.opaquetoken.client-id}")
//	String clientId;
//	
//	@Value("${spring.security.oauth2.resourceserver.opaquetoken.client-secret}")
//	String clientSecret;
//
//	@Override
//	protected void configure(HttpSecurity http) throws Exception {
//		// @formatter:off
//		http
//			.authorizeRequests(authorizeRequests ->
//				authorizeRequests
//					.antMatchers(HttpMethod.GET, "/message/**").hasAuthority("SCOPE_message:read")
//					.antMatchers(HttpMethod.POST, "/message/**").hasAuthority("SCOPE_message:write")
//					.anyRequest().authenticated()
//			)
//			.oauth2ResourceServer(oauth2ResourceServer ->
//				oauth2ResourceServer
//					.opaqueToken(opaqueToken ->
//						opaqueToken
//							.introspectionUri(this.introspectionUri)
//							.introspectionClientCredentials(this.clientId, this.clientSecret)
//					)
//			);
//		// @formatter:on
//	}

	@Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
	String jwkSetUri;

	@Override
	protected void configure(HttpSecurity http) throws Exception {
		// @formatter:off
		http
			.authorizeRequests(authorizeRequests ->
				authorizeRequests
					.antMatchers("/api/priv/**").authenticated()
					.anyRequest().permitAll()
			)
			.oauth2ResourceServer(OAuth2ResourceServerConfigurer::jwt);
		// @formatter:on	
		
		http.cors();
		http.csrf().disable();
	}

	@Bean
	JwtDecoder jwtDecoder() {
		return NimbusJwtDecoder.withJwkSetUri(this.jwkSetUri).build();
	}
}
