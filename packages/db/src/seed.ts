/**
 * Тестовые данные для локальной разработки: `pnpm db:seed`.
 * Идемпотентно: если автор уже есть, ничего не делает. Начать с нуля — `pnpm db:reset`.
 * Медиа лежат в apps/api/dev-media (ключ файла = storage_key).
 */
import { createPrismaClient } from './index';

const DAY = 24 * 60 * 60 * 1000;

async function main() {
  const prisma = createPrismaClient();
  try {
    const existing = await prisma.creatorProfile.findUnique({ where: { handle: 'sara.brews' } });
    if (existing) {
      console.log('Seed: данные уже есть, пропускаю.');
      return;
    }

    const now = Date.now();

    const sara = await prisma.user.create({
      data: { clerkUserId: 'dev_sara', email: 'sara@example.com', authProvider: 'google', role: 'creator' },
    });
    await prisma.creatorProfile.create({
      data: {
        userId: sara.id,
        handle: 'sara.brews',
        displayName: 'سارة',
        bio: 'أجرّب محامص الخليج وأشارككم وصفات القهوة في البيت. فيديو جديد كل أحد وأربعاء.',
        avatarUrl: 'sara-avatar.jpg',
        coverUrl: 'sara-cover.jpg',
        status: 'approved',
        kycStatus: 'approved',
      },
    });

    const [basic, close, vip] = await Promise.all([
      prisma.subscriptionTier.create({
        data: { creatorId: sara.id, level: 1, name: 'الأساسي', priceMinor: 2900, currency: 'AED', perks: ['كل المنشورات والفيديو'] },
      }),
      prisma.subscriptionTier.create({
        data: { creatorId: sara.id, level: 2, name: 'المقرّبون', priceMinor: 5900, currency: 'AED', perks: ['كل المحتوى', 'بث أسبوعي خلف الكواليس'] },
      }),
      prisma.subscriptionTier.create({
        data: { creatorId: sara.id, level: 3, name: 'VIP', priceMinor: 11900, currency: 'AED', perks: ['كل ما في المقرّبين', 'رد شخصي على رسائلك'] },
      }),
    ]);

    type SeedPost = {
      text: string;
      accessMode: 'free' | 'subscribers' | 'paid';
      minTierId?: string;
      priceMinor?: number;
      media: { key: string; kind: 'photo' | 'video'; duration?: number };
      daysAgo: number;
    };
    const posts: SeedPost[] = [
      { text: 'إسبريسو من محمصة جديدة في القوز.', accessMode: 'free', media: { key: 'post-espresso.jpg', kind: 'photo' }, daysAgo: 0 },
      { text: 'ميمي تراقب تحضير القهوة.', accessMode: 'free', media: { key: 'post-mimi.jpg', kind: 'photo' }, daysAgo: 1 },
      { text: 'سر الكريما المثالية: الطحن والحرارة.', accessMode: 'subscribers', minTierId: basic.id, media: { key: 'post-crema.jpg', kind: 'photo' }, daysAgo: 2 },
      { text: 'بث خلف الكواليس: تحميص في البيت.', accessMode: 'subscribers', minTierId: close.id, media: { key: 'post-saucer.jpg', kind: 'video', duration: 760 }, daysAgo: 3 },
      { text: 'الطريقة الكاملة: إسبريسو في البيت بدون مكينة غالية.', accessMode: 'paid', priceMinor: 2500, media: { key: 'post-spoon.jpg', kind: 'photo' }, daysAgo: 4 },
      { text: 'جولة على 5 محامص في دبي.', accessMode: 'paid', priceMinor: 4000, media: { key: 'post-wood.jpg', kind: 'video', duration: 485 }, daysAgo: 5 },
    ];

    const created = [];
    for (const p of posts) {
      const post = await prisma.post.create({
        data: {
          creatorId: sara.id,
          text: p.text,
          accessMode: p.accessMode,
          minTierId: p.minTierId,
          priceMinor: p.priceMinor,
          currency: p.priceMinor ? 'AED' : undefined,
          publishedAt: new Date(now - p.daysAgo * DAY),
          moderationStatus: 'approved',
          media: {
            create: { kind: p.media.kind, storageKey: p.media.key, status: 'ready', duration: p.media.duration },
          },
        },
      });
      created.push(post);
    }

    // Фанат: подписан на «المقرّبون» и купил один платный пост.
    const maryam = await prisma.user.create({
      data: { clerkUserId: 'dev_maryam', phone: '+971501234567', authProvider: 'phone', role: 'fan' },
    });
    const periodEnd = new Date(now + 30 * DAY);
    await prisma.subscription.create({
      data: { fanId: maryam.id, tierId: close.id, status: 'active', currentPeriodEnd: periodEnd, providerSubId: 'dev_sub_maryam_close' },
    });
    await prisma.accessGrant.create({
      data: { fanId: maryam.id, tierId: close.id, source: 'subscription', expiresAt: periodEnd },
    });
    const paidPhoto = created[4]!;
    await prisma.purchase.create({
      data: {
        fanId: maryam.id,
        creatorId: sara.id,
        kind: 'post_unlock',
        targetId: paidPhoto.id,
        amountMinor: 2500,
        feeMinor: 250,
        currency: 'AED',
        providerPaymentId: 'dev_pi_maryam_spoon',
        status: 'succeeded',
      },
    });
    await prisma.accessGrant.create({ data: { fanId: maryam.id, postId: paidPhoto.id, source: 'purchase' } });

    console.log(`Seed: автор sara.brews (${posts.length} постов, тарифы ${basic.level}/${close.level}/${vip.level}), фан dev_maryam.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
