import os
import boto3
from botocore.exceptions import BotoCoreError, ClientError


class StorageService:
    # Initialize S3 client and store bucket information
    def __init__(self, bucket_name: str, region_name: str = "us-east-1"):
        self.bucket_name = bucket_name
        # Create an S3 client using boto3
        self.s3 = boto3.client("s3", region_name=region_name)

    # Function to upload a file from local system to S3
    def upload_file(self, file_path: str, object_name: str | None = None) -> str | None:
        # Check if file exists locally
        if not os.path.isfile(file_path):
            print(f"File not found: {file_path}")
            return None

        # If no object name is provided, use the file name
        if object_name is None:
            object_name = os.path.basename(file_path)

        try:
            # Upload file to S3 bucket
            self.s3.upload_file(file_path, self.bucket_name, object_name)

            print(f"Upload successful: {object_name}")
            return object_name

        except (BotoCoreError, ClientError, Exception) as e:
            # Handle possible AWS or connection errors
            print(f"Upload failed: {e}")
            return None