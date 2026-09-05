import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:sms/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    // permission_handler：短信权限已授权（granted == 1）。
    const permissionChannel = MethodChannel(
      'flutter.baseflow.com/permissions/methods',
    );
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(permissionChannel, (MethodCall call) async {
          if (call.method == 'checkPermissionStatus') return 1;
          return 0;
        });

    // sms_advanced：短信库为空。
    const queryChannel = MethodChannel(
      'plugins.elyudde.com/querySMS',
      JSONMethodCodec(),
    );
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(queryChannel, (MethodCall call) async {
          return <dynamic>[];
        });
  });

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('flutter.baseflow.com/permissions/methods'),
          null,
        );
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel(
            'plugins.elyudde.com/querySMS',
            JSONMethodCodec(),
          ),
          null,
        );
  });

  testWidgets('App boots and shows empty SMS state', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const SmsApp());
    await tester.pumpAndSettle();

    // 空列表时 AppBar 显示应用名（测试默认英文 locale）。
    expect(find.text('SMS'), findsOneWidget);
    // 空状态页提供“请求权限”入口。
    expect(find.text('Request SMS Permission'), findsOneWidget);
  });
}
