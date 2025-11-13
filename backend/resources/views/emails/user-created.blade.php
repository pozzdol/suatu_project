<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Account is Ready</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
            background-color: #f5f5f7;
            color: #1d1d1f;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .wrapper {
            width: 100%;
            background-color: #f5f5f7;
            padding: 40px 20px;
            box-sizing: border-box;
        }
        .container {
            max-width: 560px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #d2d2d7;
            border-radius: 12px;
            overflow: hidden;
        }
        .header {
            padding: 40px 40px 20px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin: 0 0 10px;
            color: #000000;
        }
        .content {
            padding: 20px 40px 40px;
            font-size: 17px;
            line-height: 1.47;
            letter-spacing: -0.022em;
        }
        .content p {
            margin: 0 0 20px;
        }
        .credentials {
            background-color: #f5f5f7;
            padding: 20px;
            border-radius: 8px;
            margin-top: 25px;
        }
        .credentials p {
            margin: 12px 0;
            font-size: 16px;
        }
        .credentials strong {
            display: inline-block;
            width: 100px;
            color: #6e6e73;
        }
        .button-container {
            text-align: center;
            margin-top: 30px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #007aff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
        }
        .footer {
            padding: 30px 40px;
            text-align: center;
            font-size: 12px;
            color: #6e6e73;
        }
        .footer p {
            margin: 0 0 5px;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Welcome to {{ config('app.name') }}</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{{ $user->name }}</strong>,</p>
                <p>Your account has been created and is now ready to use in our application. You can log in with the following credentials.</p>

                <div class="credentials">
                    <p><strong>Email:</strong> {{ $user->email }}</p>
                    <p><strong>Password:</strong> {{ $password }}</p>
                </div>

                <p style="margin-top: 30px;">For security, we strongly recommend changing your password after your first login.</p>
            </div>
            <div class="footer">
                <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
                <p>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>
