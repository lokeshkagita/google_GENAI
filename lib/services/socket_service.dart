// lib/services/socket_service.dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  static SocketService? _instance;
  IO.Socket? _socket;
  
  SocketService._internal();
  
  static SocketService get instance {
    _instance ??= SocketService._internal();
    return _instance!;
  }
  
  // NOTE: Socket service disabled - matching uses Supabase real-time instead
  static const String serverUrl = 'disabled'; // No backend connection needed
  
  void connect() {
    // Disabled: Matching functionality uses Supabase real-time subscriptions
    print('Socket service disabled - using Supabase for real-time features');
    return;
  }
  
  void disconnect() {
    print('Disconnecting from server...');
    _socket?.disconnect();
    _socket = null;
  }
  
  void joinRoom(String roomId) {
    if (_socket?.connected == true) {
      _socket?.emit('join_room', roomId);
      print('📨 Joined room: $roomId');
    } else {
      print('❌ Cannot join room - not connected');
    }
  }
  
  void sendMessage({
    required String roomId,
    required String text,
    required String sender,
    String? mood,
  }) {
    if (_socket?.connected == true) {
      final messageData = {
        'roomId': roomId,
        'text': text,
        'sender': sender,
        'timestamp': DateTime.now().toIso8601String(),
        'mood': mood,
      };
      
      _socket?.emit('send_message', messageData);
      print('📨 Message sent: $text');
    } else {
      print('❌ Cannot send message - not connected');
    }
  }
  
  void onMessageReceived(Function(Map<String, dynamic>) callback) {
    _socket?.on('receive_message', (data) {
      print('📨 Message received: $data');
      if (data is Map<String, dynamic>) {
        callback(data);
      }
    });
  }
  
  void onUserJoined(Function(Map<String, dynamic>) callback) {
    _socket?.on('user_joined', (data) {
      print('👤 User joined: $data');
      if (data is Map<String, dynamic>) {
        callback(data);
      }
    });
  }
  
  void onUserTyping(Function(Map<String, dynamic>) callback) {
    _socket?.on('user_typing', (data) {
      if (data is Map<String, dynamic>) {
        callback(data);
      }
    });
  }
  
  bool get isConnected => _socket?.connected ?? false;
  
  String? get socketId => _socket?.id;
  
  // Add method to test connection
  void testConnection() {
    print('Testing connection...');
    print('Socket exists: ${_socket != null}');
    print('Socket connected: ${_socket?.connected}');
    print('Socket ID: ${_socket?.id}');
    print('Server URL: $serverUrl');
  }
}