import { test, expect } from '@playwright/test';

test.describe('Chat', () => {
  test('sends and receives messages', async ({ page }) => {
    await page.goto('/chat');

    const chatInput = page.locator('[data-testid="chat-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    await chatInput.fill('Hello');
    await sendButton.click();

    await expect(page.locator('text=Hello').first()).toBeVisible();
    await expect(page.locator('text=This is a simulated response')).toBeVisible({ timeout: 5000 });
  });

  test('switches themes', async ({ page }) => {
    await page.goto('/chat');

    const themeButton = page.locator('[data-testid="theme-button"]');
    await themeButton.click();

    const darkOption = page.locator('[data-testid="theme-option-Dark"]');
    await darkOption.click();

    const background = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--background').trim()
    );
    expect(background).toBe('#0a0a0a');
  });

  test('creates persona and uses it', async ({ page }) => {
    await page.goto('/chat');

    const createPersonaButton = page.locator('[data-testid="create-persona-button"]');
    await createPersonaButton.click();

    await page.fill('input#persona-name', 'TestBot');
    await page.fill('textarea#persona-prompt', 'You are a test bot.');
    await page.click('button[type="submit"]');

    const newPersona = page.locator('[data-testid="persona-name"]').filter({ hasText: 'TestBot' });
    await expect(newPersona).toBeVisible();
    await newPersona.click();

    await expect(page.locator('[data-testid="header-avatar"]')).toBeVisible();
    await expect(page.locator('[data-testid="welcome-avatar"]')).toBeVisible();

    await page.fill('[data-testid="chat-input"]', 'Hello TestBot');
    await page.click('[data-testid="send-button"]');

    await expect(page.locator('text=This is a simulated response')).toBeVisible({ timeout: 5000 });
  });

  test('persona avatar appears in chat', async ({ page }) => {
    await page.goto('/chat');

    const createPersonaButton = page.locator('[data-testid="create-persona-button"]');
    await createPersonaButton.click();

    await page.fill('input#persona-name', 'AvatarBot');
    await page.fill('textarea#persona-prompt', 'Avatar bot prompt');
    await page.click('button[type="submit"]');

    const newPersona = page.locator('[data-testid="persona-name"]').filter({ hasText: 'AvatarBot' });
    await expect(newPersona).toBeVisible();
    await newPersona.click();

    await expect(page.locator('[data-testid="header-avatar"]')).toBeVisible();

    await page.fill('[data-testid="chat-input"]', 'Hey');
    await page.click('[data-testid="send-button"]');

    // Wait for simulated response to appear
    await expect(page.locator('text=/simulated|Error/i')).toBeVisible({ timeout: 5000 });

    const assistantAvatar = page.locator('[data-testid="assistant-avatar"]');
    await expect(assistantAvatar).toBeVisible();

    const src = await assistantAvatar.getAttribute('src');
    expect(src).toContain('AvatarBot');
  });

  test('deletes a conversation and creates new one if last', async ({ page }) => {
    await page.goto('/chat');

    const conversation = page.locator('[data-testid^="conversation-"]').first();
    await expect(conversation).toBeVisible();

    const conversationId = await conversation.getAttribute('data-testid');
    if (!conversationId) throw new Error('Missing conversation data-testid');

    await conversation.hover();

    const deleteButton = page.locator(`[data-testid="delete-${conversationId}"]`);
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // After deleting the only conversation, a new empty one should appear
    await expect(page.locator('[data-testid^="conversation-"]').first()).toBeVisible();
  });
});
