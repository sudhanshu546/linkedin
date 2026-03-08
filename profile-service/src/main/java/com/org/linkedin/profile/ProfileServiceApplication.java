package com.org.linkedin.profile;

import com.org.linkedin.utility.client.FeignAuthenticationInterceptor;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaAuditing
@OpenAPIDefinition(
        info =
        @Info(
                title = "Profile Service",
                version = "1.0",
                description = "Documentation Profile Service v1.0"))
@ComponentScan(
        basePackages = {"com.org.linkedin.utility", "com.org.linkedin.profile" , "com.org.linkedin.dto"},
        basePackageClasses = FeignAuthenticationInterceptor.class)
@EnableFeignClients("com.org.linkedin.utility.client")
@EnableJpaRepositories(basePackages = "com.org.linkedin.profile.repo")
@EntityScan(basePackages = {"com.org.linkedin.domain", "com.org.linkedin.profile.domain"})
public class ProfileServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ProfileServiceApplication.class, args);
	}

}
