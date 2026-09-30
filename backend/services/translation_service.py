import boto3


class TranslationService:
    # Initialize AWS Translate client
    def __init__(self, region_name='us-east-1'):
        # Create a Translate client using boto3
        self.client = boto3.client('translate', region_name=region_name)

    # Function to translate text into a target language
    def translate_text(self, text, target_language='zh'):
        try:
            # Call AWS Translate API
            response = self.client.translate_text(
                Text=text,                       # Input text to be translated
                SourceLanguageCode='auto',       # Automatically detect source language
                TargetLanguageCode=target_language  # Target language (e.g., 'zh' for Chinese)
            )

            # Extract translated text from response
            translated_text = response['TranslatedText']
            
            return translated_text

        except Exception as e:
            # Handle any errors during API call
            print(f"Error translating text: {e}")
            return ""