# GitHub Models Setup Guide

This guide explains how to set up GitHub Models integration in your application.

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# GitHub Models API Configuration
GITHUB_MODELS_API_KEY=your_github_models_api_key_here
GITHUB_MODELS_API_BASE_URL=https://models.github.ai/inference
```

## Available Models

The following models are available through GitHub Models:

### OpenAI Models
- `openai/gpt-4o` - GPT-4o
- `openai/gpt-4o-mini` - GPT-4o mini
- `openai/gpt-4-turbo` - GPT-4 Turbo
- `openai/gpt-4.1-nano` - GPT-4.1 Nano

## How to Use

1. Set up your environment variables as shown above
2. Restart your development server
3. Select a GitHub Models provider from the model selector
4. Start chatting with the selected model

## Features

- Native tool calling support
- Compatible with OpenAI API format
- Uses the GitHub Models inference endpoint

## Troubleshooting

If you encounter issues:

1. Ensure your API key is valid
2. Check that the base URL is correct
3. Verify that the model IDs are properly formatted
4. Make sure your environment variables are loaded correctly

## API Reference

GitHub Models uses the same API format as OpenAI, so it's compatible with the AI SDK's OpenAI provider. 