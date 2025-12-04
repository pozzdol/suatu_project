<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Peringatan Stok Rendah</title>
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
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #d2d2d7;
            border-radius: 12px;
            overflow: hidden;
        }
        .header {
            padding: 40px 40px 20px;
            text-align: center;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
        }
        .header-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 600;
            margin: 0;
            color: #ffffff;
        }
        .header p {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
            margin: 10px 0 0;
        }
        .content {
            padding: 30px 40px;
            font-size: 16px;
            line-height: 1.6;
            letter-spacing: -0.022em;
        }
        .content p {
            margin: 0 0 20px;
            color: #333;
        }
        .alert-box {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 25px;
        }
        .alert-box p {
            margin: 0;
            color: #856404;
            font-size: 14px;
        }
        .table-container {
            overflow-x: auto;
            margin: 25px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        thead {
            background-color: #2c3e50;
        }
        thead th {
            padding: 14px 16px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        thead th:nth-child(2),
        thead th:nth-child(3) {
            text-align: center;
        }
        tbody tr {
            border-bottom: 1px solid #e9ecef;
        }
        tbody tr:last-child {
            border-bottom: none;
        }
        tbody tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        tbody td {
            padding: 14px 16px;
            font-size: 14px;
            color: #333;
        }
        tbody td:nth-child(2),
        tbody td:nth-child(3) {
            text-align: center;
        }
        .stock-critical {
            color: #dc3545;
            font-weight: 700;
        }
        .stock-warning {
            color: #fd7e14;
            font-weight: 600;
        }
        .stock-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge-critical {
            background-color: #f8d7da;
            color: #721c24;
        }
        .badge-warning {
            background-color: #fff3cd;
            color: #856404;
        }
        .action-box {
            background-color: #e8f4fd;
            border: 1px solid #bee5eb;
            border-radius: 8px;
            padding: 20px;
            margin-top: 25px;
        }
        .action-box h3 {
            margin: 0 0 10px;
            font-size: 16px;
            color: #0c5460;
        }
        .action-box ul {
            margin: 0;
            padding-left: 20px;
            color: #0c5460;
        }
        .action-box li {
            margin-bottom: 8px;
            font-size: 14px;
        }
        .footer {
            padding: 25px 40px;
            text-align: center;
            font-size: 12px;
            color: #6e6e73;
            background-color: #f8f9fa;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 0 0 5px;
        }
        .footer .app-name {
            font-weight: 600;
            color: #333;
        }
        .divider {
            height: 1px;
            background-color: #e9ecef;
            margin: 20px 0;
        }
        .summary {
            display: flex;
            justify-content: space-around;
            text-align: center;
            margin: 20px 0;
        }
        .summary-item {
            flex: 1;
        }
        .summary-number {
            font-size: 32px;
            font-weight: 700;
            color: #dc3545;
        }
        .summary-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="header-icon">⚠️</div>
                <h1>Peringatan Stok Rendah</h1>
                <p>Sistem mendeteksi raw material dengan stok di bawah batas minimum</p>
            </div>

            <div class="content">
                <p>Halo <strong>{{ $user->name }}</strong>,</p>

                <p>Setelah konfirmasi order, sistem mendeteksi beberapa raw material memiliki stok di bawah batas minimum yang ditentukan.</p>

                <div class="alert-box">
                    <p><strong>⚡ Perhatian:</strong> Segera lakukan pengadaan untuk menghindari gangguan produksi.</p>
                </div>

                <div style="text-align: center; margin: 25px 0;">
                    <table style="display: inline-block; box-shadow: none;">
                        <tr>
                            <td style="text-align: center; padding: 10px 30px; border-right: 1px solid #e9ecef;">
                                <div class="summary-number">{{ count($materials) }}</div>
                                <div class="summary-label">Material</div>
                            </td>
                            <td style="text-align: center; padding: 10px 30px;">
                                <div class="summary-number">{{ $threshold }}</div>
                                <div class="summary-label">Batas Minimum</div>
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nama Material</th>
                                <th>Stok Saat Ini</th>
                                <th>Batas Minimum</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($materials as $material)
                            <tr>
                                <td><strong>{{ $material['name'] }}</strong></td>
                                <td>
                                    @if($material['stock'] < 100)
                                        <span class="stock-badge badge-critical">{{ $material['stock'] }} {{ $material['unit'] }}</span>
                                    @else
                                        <span class="stock-badge badge-warning">{{ $material['stock'] }} {{ $material['unit'] }}</span>
                                    @endif
                                </td>
                                <td>{{ $threshold }} {{ $material['unit'] }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>

                <div class="action-box">
                    <h3>📋 Tindakan yang Disarankan</h3>
                    <ul>
                        <li>Segera hubungi supplier untuk pengadaan material</li>
                        <li>Prioritaskan material dengan stok <strong>kritis</strong> (merah)</li>
                        <li>Pertimbangkan untuk menyesuaikan jadwal produksi jika diperlukan</li>
                        <li>Update stok di sistem setelah material diterima</li>
                    </ul>
                </div>
            </div>

            <div class="footer">
                <p class="app-name">{{ config('app.name') }}</p>
                <p>Email ini dikirim secara otomatis oleh sistem</p>
                <p>{{ now()->format('d F Y, H:i:s') }} WIB</p>
            </div>
        </div>
    </div>
</body>
</html>
