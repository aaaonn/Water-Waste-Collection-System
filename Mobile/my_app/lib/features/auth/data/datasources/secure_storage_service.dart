import 'dart:convert';
import 'dart:io';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

abstract class SecureStorageService {
  Future<void> write(String key, String value);
  Future<String?> read(String key);
  Future<void> delete(String key);
  Future<void> clearAll();
}

class SecureStorageServiceImpl implements SecureStorageService {
  File? _file;

  Future<File> _getFile() async {
    if (_file != null) return _file!;
    String dbPath;
    try {
      dbPath = await getDatabasesPath();
    } catch (e) {
      dbPath = Directory.systemTemp.path;
    }
    final file = File(join(dbPath, 'secure_store.json'));
    if (!await file.exists()) {
      await file.create(recursive: true);
      await file.writeAsString(json.encode({}));
    }
    _file = file;
    return _file!;
  }

  Future<Map<String, String>> _readMap() async {
    try {
      final file = await _getFile();
      final contents = await file.readAsString();
      final decoded = json.decode(contents);
      if (decoded is Map) {
        return decoded.map((k, v) => MapEntry(k.toString(), v.toString()));
      }
    } catch (_) {}
    return {};
  }

  Future<void> _writeMap(Map<String, String> map) async {
    try {
      final file = await _getFile();
      await file.writeAsString(json.encode(map));
    } catch (_) {}
  }

  @override
  Future<void> write(String key, String value) async {
    final map = await _readMap();
    map[key] = value;
    await _writeMap(map);
  }

  @override
  Future<String?> read(String key) async {
    final map = await _readMap();
    return map[key];
  }

  @override
  Future<void> delete(String key) async {
    final map = await _readMap();
    map.remove(key);
    await _writeMap(map);
  }

  @override
  Future<void> clearAll() async {
    await _writeMap({});
  }
}
