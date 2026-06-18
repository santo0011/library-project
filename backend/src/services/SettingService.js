import { settingRepository } from '../repositories/SettingRepository.js';

class SettingService {
  async list() {
    const settings = await settingRepository.find();
    if (settings.length) return settings;

    return Promise.all([
      settingRepository.upsertByKey('companyName', 'Enterprise Admin', 'general'),
      settingRepository.upsertByKey('timezone', 'UTC', 'general'),
      settingRepository.upsertByKey('passwordPolicy', { minLength: 8, requireSymbol: true }, 'security')
    ]);
  }

  update(key, value, group, userId) {
    return settingRepository.upsertByKey(key, value, group, userId);
  }
}

export const settingService = new SettingService();
