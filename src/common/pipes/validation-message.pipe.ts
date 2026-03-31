/**
 * Translates class-validator error messages from English to Russian.
 * Used by the global ValidationPipe exceptionFactory.
 */

type TranslationRule = {
  pattern: RegExp;
  translate: (match: RegExpMatchArray) => string;
};

const rules: TranslationRule[] = [
  {
    pattern: /^(.+) should not be empty$/,
    translate: (m) => `Поле ${m[1]} обязательно для заполнения`,
  },
  {
    pattern: /^(.+) must be a string$/,
    translate: (m) => `Поле ${m[1]} должно быть текстом`,
  },
  {
    pattern: /^(.+) must be a number .*/,
    translate: (m) => `Поле ${m[1]} должно быть числом`,
  },
  {
    pattern: /^(.+) must be a number$/,
    translate: (m) => `Поле ${m[1]} должно быть числом`,
  },
  {
    pattern: /^(.+) must be a mongodb id$/,
    translate: (m) => `Некорректный идентификатор для поля ${m[1]}`,
  },
  {
    pattern: /^(.+) must be an email$/,
    translate: () => `Некорректный email`,
  },
  {
    pattern: /^property (.+) should not exist$/,
    translate: (m) => `Неизвестное поле: ${m[1]}`,
  },
  {
    pattern:
      /^(.+) must be longer than or equal to (\d+) characters$/,
    translate: (m) =>
      `Поле ${m[1]} должно содержать не менее ${m[2]} символов`,
  },
  {
    pattern:
      /^(.+) must be shorter than or equal to (\d+) characters$/,
    translate: (m) =>
      `Поле ${m[1]} должно содержать не более ${m[2]} символов`,
  },
  {
    pattern: /^(.+) must not be less than (.+)$/,
    translate: (m) => `Значение ${m[1]} не может быть меньше ${m[2]}`,
  },
  {
    pattern: /^(.+) must not be greater than (.+)$/,
    translate: (m) =>
      `Значение ${m[1]} не может быть больше ${m[2]}`,
  },
  {
    pattern: /^(.+) must be one of the following values:/,
    translate: (m) => `Недопустимое значение для поля ${m[1]}`,
  },
];

export function translateValidationMessage(message: string): string {
  for (const rule of rules) {
    const match = message.match(rule.pattern);
    if (match) {
      return rule.translate(match);
    }
  }
  // Return original message if no rule matched
  return message;
}

export function translateValidationMessages(
  messages: string | string[],
): string | string[] {
  if (Array.isArray(messages)) {
    return messages.map(translateValidationMessage);
  }
  return translateValidationMessage(messages);
}
