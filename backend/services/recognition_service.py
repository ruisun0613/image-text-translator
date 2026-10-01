import boto3
import re

class RecognitionService:
    # Initialize AWS Rekognition client
    def __init__(self, region_name='us-east-1'):
        # Create a Rekognition client using boto3
        self.client = boto3.client('rekognition', region_name=region_name)

    # Check whether detected text is a URL or domain
    def is_url_or_domain(self,text):
        pattern = r'^(https?://|www\.)?\S+\.(com|net|org|ca|io|co|edu|gov)(/\S*)?$'
        return bool(re.match(pattern, text.strip(), re.IGNORECASE))

    # Function to detect text from an image stored in S3
    def detect_text(self, bucket_name, image_name):
        try:
            # Call AWS Rekognition API to detect text in the image
            response = self.client.detect_text(
                Image={
                    'S3Object': {
                        'Bucket': bucket_name,  # S3 bucket name
                        'Name': image_name      # Image file name in S3
                    }
                }
            )

            words = []

            # Loop through detected text elements
            for item in response['TextDetections']:
                # Filter only WORD-level results
                if item['Type'] == 'WORD':
                    detected_word = item['DetectedText']

                    # Ignore URLs and domain names
                    if not self.is_url_or_domain(detected_word):
                        words.append(detected_word)

            # Combine all detected words into a single string
            full_text = " ".join(words)

            return full_text

        except Exception as e:
            # Handle errors during detection
            print(f"Error detecting text: {e}")
            return ""