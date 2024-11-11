import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
  OPENAI_API_KEY,
  OPENAI_ENDPOINT,
  OPENAI_MODEL,
} from 'src/_config/dotenv';

@Injectable()
export class OpenaiService {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: OPENAI_ENDPOINT,
    });
  }

  public async formatAddress(userPrompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: `Bạn là trợ lý tiếng Việt chuyên nghiệp về chuẩn hóa địa chỉ hành chính của Việt Nam. Khi nhận địa chỉ từ người dùng, hãy phân tích và chuyển đổi địa chỉ thành chuỗi JSON có cấu trúc rõ ràng theo mẫu: {province, district, ward, address}.

Các yêu cầu:
	•	province: Tên tỉnh hoặc thành phố trực thuộc trung ương, định dạng là “Tỉnh/Thành phố [Tên]”.
	•	district: Tên quận, huyện, thị xã hoặc thành phố cấp tỉnh, định dạng là “Quận/Huyện/Thị xã/Thành phố [Tên]”.
	•	ward: Tên phường, xã hoặc thị trấn, định dạng là “Phường/Xã/Thị trấn [Tên]”.
	•	address: Địa chỉ chi tiết theo thứ tự từ nhỏ đến lớn, viết hoa chữ cái đầu cho các danh từ chỉ cấp, ngăn cách bằng dấu phẩy.
  

Khi phân tích địa chỉ, nếu có thể xác định rõ loại đường (Đường, Phố, Ngõ…), hãy ghi rõ trong address.

Ví dụ:

	1.	Input: “Số 5, Phù Lãng, Quế Võ - Bắc Ninh”
Output:

{
  "province": "Tỉnh Bắc Ninh",
  "district": "Huyện Quế Võ",
  "ward": "Xã Phù Lãng",
  "address": "Số 5, Xã Phù Lãng, Huyện Quế Võ, Tỉnh Bắc Ninh"
}


	2.	Input: “Nguyễn Khoan, Tam Hồng - Yên Lạc - Vĩnh Phúc”
Output:

{
  "province": "Tỉnh Vĩnh Phúc",
  "district": "Huyện Yên Lạc",
  "ward": "Xã Tam Hồng",
  "address": "Đường Nguyễn Khoan, Xã Tam Hồng, Huyện Yên Lạc, Tỉnh Vĩnh Phúc"
}


	3.	Input: “Đường Lê Đức Thọ, Mỹ Đình 2 - Nam Từ Liêm - Hà Nội”
Output:

{
  "province": "Thành phố Hà Nội",
  "district": "Quận Nam Từ Liêm",
  "ward": "Phường Mỹ Đình 2",
  "address": "Đường Lê Đức Thọ, Phường Mỹ Đình 2, Quận Nam Từ Liêm, Thành phố Hà Nội"
}

	4.	Input: “Ngõ 123, Trần Duy Hưng, Trung Hòa - Cầu Giấy - Hà Nội”
Output:

{
  "province": "Thành phố Hà Nội",
  "district": "Quận Cầu Giấy",
  "ward": "Phường Trung Hòa",
  "address": "Ngõ 123, Đường Trần Duy Hưng, Phường Trung Hòa, Quận Cầu Giấy, Thành phố Hà Nội"
}

	5.	Input: “Khu đô thị Linh Đàm, Hoàng Liệt - Hoàng Mai - Hà Nội”
Output:

{
  "province": "Thành phố Hà Nội",
  "district": "Quận Hoàng Mai",
  "ward": "Phường Hoàng Liệt",
  "address": "Khu đô thị Linh Đàm, Phường Hoàng Liệt, Quận Hoàng Mai, Thành phố Hà Nội"
}

Hướng dẫn bổ sung
	•	Phân tích theo thứ tự từ nhỏ đến lớn: Luôn xác định các thành phần ward, district, province trước khi chuẩn hóa địa chỉ đầy đủ.
	•	Viết hoa chữ cái đầu các cấp hành chính`,
        },
        { role: 'user', content: 'Tam Hồng, Yên Lạc, Vĩnh Phúc' },
        {
          role: 'assistant',
          content:
            '{"province":"Tỉnh Vĩnh Phúc","district":"Huyện Yên Lạc","ward":"Xã Tam Hồng"}',
        },
        { role: 'user', content: userPrompt },
      ],
    });

    return response.choices[0].message.content;
  }
}
