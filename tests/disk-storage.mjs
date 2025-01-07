import fs from 'fs';
import path from 'path';

class DiskStorage {
  constructor(storageFile = 'storage.json') {
    if (DiskStorage.instance) {
      return DiskStorage.instance;
    }

    this.filePath = path.resolve(storageFile);

    // Initialize the file if it doesn't exist
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({}), 'utf-8');
    }

    DiskStorage.instance = this; // Save the instance for reuse
  }

  // Set a value in storage
  set(key, value) {
    const data = this._readStorage();
    data[key] = value;
    this._writeStorage(data);
  }

  // Get a value from storage
  get(key) {
    const data = this._readStorage();
    return data[key] !== undefined ? data[key] : null; // Return null if the key does not exist
  }

  // Private method to read storage file
  _readStorage() {
    try {
      const fileContent = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading storage file:', error);
      return {};
    }
  }

  // Private method to write to storage file
  _writeStorage(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing to storage file:', error);
    }
  }
}

// Export a shared instance of the DiskStorage
const sharedStorage = new DiskStorage();
export default sharedStorage;
