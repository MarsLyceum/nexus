import os
from pathlib import Path
from gcp_microservice_management import (
    find_env_file,
    load_env_variables,
    find_key_file,
    deploy_to_cloud_run,
    color_text,
    run_command,
    OKCYAN,
    OKGREEN,
)

script_dir = Path(__file__).resolve().parent
dockerfile_path = script_dir / "Dockerfile"
repo_root = script_dir.parent.parent  # …/nexus
build_context = repo_root


def main() -> None:
    project_id = "hephaestus-418809"
    region = "us-west1"
    service_name = "next-server"

    env_vars: dict[str, str | None] = {}

    env_file = find_env_file()
    if env_file is not None:
        print(color_text(f"Using .env file: {env_file}", OKGREEN))
        env_vars = load_env_variables(env_file)

    # Locate the GCP service account key
    key_file = find_key_file(
        "../../service-account-keys", "hephaestus-418809-*.json"
    )
    if key_file is not None:
        print(color_text(f"Using key file: {key_file}", OKGREEN))
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file

        # Authenticate with gcloud
        print(
            color_text(
                "Authenticating gcloud with a service account...", OKCYAN
            )
        )
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file

    # Build and push Docker image
    print(color_text("Building Docker image...", OKCYAN))
    env = os.environ.copy()
    env["DOCKER_BUILDKIT"] = "1"
    run_command(
        f"docker build -f {dockerfile_path} -t gcr.io/{project_id}/{service_name}:latest --progress=plain {build_context}",
        env=env,
    )

    print(
        color_text("Configuring Docker credential helper for GCR...", OKCYAN)
    )
    run_command("gcloud auth configure-docker --quiet", env=env)

    print(color_text("Pushing Docker image...", OKCYAN))
    run_command(f"docker push gcr.io/{project_id}/{service_name}:latest")

    jwt_secret = os.getenv("JWT_SECRET")
    if jwt_secret:
        env_vars["JWT_SECRET"] = jwt_secret

    # Deploy to Cloud Run without Cloud SQL
    print(color_text("Deploying to Cloud Run...", OKCYAN))
    deploy_to_cloud_run(
        project_id=project_id,
        region=region,
        service_name=service_name,
        env_vars=env_vars,
        force_recreate=True,
    )


if __name__ == "__main__":
    main()
