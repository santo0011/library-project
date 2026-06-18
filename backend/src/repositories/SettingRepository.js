import { Setting } from '../models/Setting.js';
import { BaseRepository } from './BaseRepository.js';

class SettingRepository extends BaseRepository {
  constructor() {
    super(Setting);
  }

  upsertByKey(key, value, group, updatedBy) {
    return this.model.findOneAndUpdate(
      { key },
      { value, group, updatedBy },
      { new: true, upsert: true, runValidators: true }
    );
  }
}

export const settingRepository = new SettingRepository();
