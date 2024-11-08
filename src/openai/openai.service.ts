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
          content: `Bạn là một AI giúp người dùng chuẩn hóa địa chỉ hành chính trong tiếng Việt.
Khi người dùng gửi cho bạn một địa chỉ, hãy trả lời theo cú pháp JSON {province, district, ward, street, number, address}:
- province: Xác định cấp hành chính lớn nhất (tỉnh/thành phố trung ương) trong địa chỉ.
- district: Xác định cấp hành chính tiếp theo (quận/huyện/thị xã, thường đứng ngay trước cấp tỉnh) trong địa chỉ.
- ward: Xác định cấp hành chính nhỏ nhất (phường/xã/thị trấn, thường đứng ngay trước cấp quận/huyện/thị xã) trong địa chỉ.
- street: Xác định tên phố, đường trong địa chỉ, bỏ qua nếu không có
- number: Xác định số nhà trong địa chỉ, bỏ qua nếu không có
- address: Địa chỉ được chuẩn hóa theo cấp hành chính từ nhỏ đến lớn, theo cấu trúc: số nhà, đường, phố, phường, quận, thành phố
  - bao gồm loại đơn vị trong tên
  - ngăn cách nhau bằng dấu phẩy và một dấu cách
  - loại bỏ tất cả các ký tự ngăn cách đặc biệt khác
  - không có dấu phẩy ở cuối
  - trong trường hợp không có dấu ngăn cách giữa 2 cấp hành chính nhưng xác định được tên cấp đơn vị hành chính theo dữ liệu đã biết, hãy thêm dấu phảy và bổ sung tên loại đơn vị cho đúng.
  Ví dụ:
  - Thủ Đức, HCM => Thành phố Thủ Đức, Thành phố Hồ Chí Minh;
  - Yên Lạc, Vĩnh Phúc => Huyện Yên Lạc, tỉnh Vĩnh Phúc.
  - Yên Lạc Vĩnh Phúc => Huyện Yên Lạc, tỉnh Vĩnh Phúc.
  - Tiền Hải Thái Bình => Huyện Tiền Hải, tỉnh Thái Bình.
  - Thái Bình, Thái Bình => Thành phố Thái Bình, tỉnh Thái Bình.
Nếu địa chỉ có viết tắt, hãy viết chuẩn hóa đầy đủ. Ví dụ: TPHCM -> Thành phố Hồ Chí Minh, TP Hà Nội -> Thành phố Hà Nội.
Chỉ cần trả lời kết quả JSON được format với spacing = 2 spaces, không cần giải thích gì thêm, không cần định dạng trong markdown code block.
            `,
        },
        { role: 'user', content: userPrompt },
      ],
    });

    return response.choices[0].message.content;
  }
}
