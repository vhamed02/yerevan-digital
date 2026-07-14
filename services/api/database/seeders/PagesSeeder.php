<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

class PagesSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'slug'    => 'about',
                'title'   => ['hy' => 'Մեր Մասին', 'en' => 'About Us'],
                'content' => [
                    'hy' => "Yerevan Digital-ն հայկական բիզնեսների համար ստեղծված առցանց խանութի հարթակ է:\n\nՄեր առաքելությունն է հնարավոր դարձնել, որ ցանկացած հայ ձեռներեց կարողանա հեշտությամբ ստեղծել և վարել իր առցանց խանութը:\n\nՄենք հավատում ենք, որ թվային առևտուրը պետք է հասանելի լինի բոլոր բիզնեսների համար՝ անկախ չափից կամ տեխնիկական փորձից:\n\nYerevan Digital-ն ապահովում է ամեն ինչ՝ ապրանքների կառավարում, հայկական վճարային համակարգեր, գեղեցիկ ձևանմուշներ և հեշտ օգտագործման վահանակ:",
                    'en' => "Yerevan Digital is an online store platform built specifically for Armenian businesses.\n\nOur mission is to empower every Armenian entrepreneur to easily create and run their own online store.\n\nWe believe digital commerce should be accessible to all businesses, regardless of size or technical experience.\n\nYerevan Digital provides everything you need — product management, Armenian payment systems, beautiful templates, and an easy-to-use dashboard.",
                ],
                'meta_title'       => ['hy' => 'Մեր Մասին — Yerevan Digital', 'en' => 'About Us — Yerevan Digital'],
                'meta_description' => [
                    'hy' => 'Ծանոթացեք Yerevan Digital-ի հետ. հայկական բիզնեսների համար ստեղծված առցանց խանութի հարթակ:',
                    'en' => 'Learn about Yerevan Digital — the online store platform built for Armenian businesses.',
                ],
            ],
            [
                'slug'    => 'contact',
                'title'   => ['hy' => 'Կապ', 'en' => 'Contact Us'],
                'content' => [
                    'hy' => "Կապ մեզ հետ:\n\nԷլ. փոստ: support@vendora.am\n\nԱշխատանքային ժամեր: Երկուշաբթի — Ուրբաթ, 10:00 — 18:00 (UTC+4)\n\nՄենք պատրաստ ենք օգնել Ձեզ Ձեր առցանց խանութի ցանկացած հարցով: Ուղարկեք նամակ և մենք կպատասխանենք 24 ժամվա ընթացքում:",
                    'en' => "Get in touch with us:\n\nEmail: support@vendora.am\n\nWorking hours: Monday — Friday, 10:00 — 18:00 (UTC+4)\n\nWe are ready to help you with any questions about your online store. Send us an email and we will respond within 24 hours.",
                ],
                'meta_title'       => ['hy' => 'Կապ — Yerevan Digital', 'en' => 'Contact Us — Yerevan Digital'],
                'meta_description' => [
                    'hy' => 'Կապ հաստատեք Yerevan Digital-ի աջակցության թիմի հետ:',
                    'en' => 'Get in touch with the Yerevan Digital support team.',
                ],
            ],
            [
                'slug'    => 'terms',
                'title'   => ['hy' => 'Օգտագործման Պայմաններ', 'en' => 'Terms of Use'],
                'content' => [
                    'hy' => "Օգտագործման Պայմաններ\n\nYerevan Digital հարթակն օգտագործելով՝ Դուք համաձայնվում եք սույն պայմաններին:\n\n1. Գրանցում\nՕգտատերերը պարտավոր են ներկայացնել ճշգրիտ տեղեկատվություն գրանցման ժամանակ: Մեկ օգտատիրոջ համար թույլատրվում է մեկ հաշիվ:\n\n2. Արտոնագրային Իրավունքներ\nYerevan Digital-ի բոլոր բովանդակությունն ու ծրագրային ապահովումը պաշտպանված է հեղինակային իրավունքով:\n\n3. Արգելված Գործողություններ\nՀարթակի չարաշահումը, կեղծ ապրանքների վաճառքը կամ խաբեությունն արգելված է:\n\n4. Պատասխանատվության Սահմանափակում\nYerevan Digital-ն պատասխանատու չէ երրորդ կողմի ծառայություններից բխող կորուստների համար:",
                    'en' => "Terms of Use\n\nBy using the Yerevan Digital platform, you agree to these terms.\n\n1. Registration\nUsers must provide accurate information during registration. One account per user is permitted.\n\n2. Intellectual Property\nAll content and software on Yerevan Digital is protected by copyright.\n\n3. Prohibited Activities\nMisuse of the platform, sale of counterfeit goods, or fraud is strictly prohibited.\n\n4. Limitation of Liability\nYerevan Digital is not responsible for losses arising from third-party services.",
                ],
                'meta_title'       => ['hy' => 'Օգտագործման Պայմաններ — Yerevan Digital', 'en' => 'Terms of Use — Yerevan Digital'],
                'meta_description' => [
                    'hy' => 'Կարդացեք Yerevan Digital հարթակի օգտագործման պայմանները:',
                    'en' => 'Read the Terms of Use for the Yerevan Digital platform.',
                ],
            ],
            [
                'slug'    => 'privacy',
                'title'   => ['hy' => 'Գաղտնիության Քաղաքականություն', 'en' => 'Privacy Policy'],
                'content' => [
                    'hy' => "Գաղտնիության Քաղաքականություն\n\nYerevan Digital-ն պատասխանատու կերպով վերաբերվում է Ձեր անձնական տվյալներին:\n\n1. Հավաքվող Տվյալներ\nՄենք հավաքում ենք անուն, էլ. փոստ, հեռախոս և վճարման տեղեկություններ:\n\n2. Տվյալների Օգտագործում\nՏվյալները օգտագործվում են ծառայությունների բարելավման, վճարումների մշակման և աջակցության համար:\n\n3. Տվյալների Անվտանգություն\nՄենք օգտագործում ենք SSL գաղտնագրում բոլոր հաղորդակցությունների համար:\n\n4. Կապ\nԳաղտնիության հարցերով դիմեք՝ privacy@vendora.am:",
                    'en' => "Privacy Policy\n\nYerevan Digital handles your personal data responsibly.\n\n1. Data We Collect\nWe collect name, email, phone number, and payment information.\n\n2. How We Use Data\nData is used to improve services, process payments, and provide support.\n\n3. Data Security\nWe use SSL encryption for all communications.\n\n4. Contact\nFor privacy questions, contact: privacy@vendora.am",
                ],
                'meta_title'       => ['hy' => 'Գաղտնիության Քաղաքականություն — Yerevan Digital', 'en' => 'Privacy Policy — Yerevan Digital'],
                'meta_description' => [
                    'hy' => 'Կարդացեք Yerevan Digital-ի գաղտնիության քաղաքականությունը:',
                    'en' => 'Read the Yerevan Digital Privacy Policy.',
                ],
            ],
        ];

        foreach ($pages as $data) {
            Page::updateOrCreate(['slug' => $data['slug']], $data);
        }
    }
}
