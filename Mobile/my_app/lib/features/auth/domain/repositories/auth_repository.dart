import '../entities/user_profile.dart';

abstract class AuthRepository {
  Future<bool> login(String username, String password);
  Future<void> logout();
  Future<bool> isLoggedIn();
  Future<String?> getToken();
  Future<UserProfile?> getProfile();
}
