import { getStoredSettings, saveSettings, Provider, Mode } from './utils/storage';

document.addEventListener('DOMContentLoaded', async () => {
  const providerSelect = document.getElementById('provider') as HTMLSelectElement;
  const defaultModeSelect = document.getElementById('defaultMode') as HTMLSelectElement;
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load existing settings
  const settings = await getStoredSettings();
  providerSelect.value = settings.provider || 'anthropic';
  defaultModeSelect.value = settings.defaultMode || 'simple';
  apiKeyInput.value = settings.apiKey || '';

  saveBtn?.addEventListener('click', async () => {
    const provider = providerSelect.value as Provider;
    const defaultMode = defaultModeSelect.value as Mode;
    const apiKey = apiKeyInput.value.trim();

    await saveSettings({ provider, defaultMode, apiKey });

    if (statusDiv) {
      statusDiv.textContent = 'Settings saved successfully!';
      statusDiv.className = 'success';
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
      }, 3000);
    }
  });
});
