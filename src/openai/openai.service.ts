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
Khi người dùng gửi cho bạn một địa chỉ, hãy trả lời theo cú pháp JSON {province, district, ward, street, number, address}, không cần giải thích, không cần định dạng markdown.
Địa chỉ được chuẩn hóa theo cấp hành chính từ nhỏ đến lớn, theo cấu trúc: số nhà, đường / phố / thôn / xóm, phường / xã / thị trấn, quận / huyện / thành phố cấp tỉnh / thị xã, tỉnh / thành phố trung ương.
Nếu tên đơn vị không có chứa tên cấp hành chính, hãy bổ sung tên cấp hành chính vào tên đơn vị. Ví dụ: Nam Định => Tỉnh Nam Định, Hải Phòng => Thành phố Hải Phòng, ...`,
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
