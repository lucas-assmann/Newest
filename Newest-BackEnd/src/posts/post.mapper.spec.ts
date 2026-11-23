import { postSelect, toPostDto } from './post.mapper';

describe('post.mapper', () => {
  it('postSelect só busca o like do usuário logado', () => {
    expect(postSelect('u1').likes).toEqual({
      where: { userId: 'u1' },
      select: { id: true },
    });
  });

  it('toPostDto monta o formato que o front usa', () => {
    const createdAt = new Date('2026-01-01');
    expect(
      toPostDto({
        id: 'p1',
        title: 't',
        content: 'c',
        images: ['img'],
        likesCount: 7,
        createdAt,
        editedAt: null,
        author: { id: 'a', name: 'ana', avatar: null },
        likes: [{ id: 'l1' }],
        _count: { comments: 2 },
      }),
    ).toEqual({
      id: 'p1',
      title: 't',
      content: 'c',
      images: ['img'],
      likes: 7,
      comments: 2,
      createdAt,
      editedAt: null,
      author: { id: 'a', name: 'ana', avatar: null },
      isLiked: true,
    });
  });

  it('sem like do usuário, isLiked é false', () => {
    const dto = toPostDto({
      id: 'p1',
      title: '',
      content: 'c',
      images: [],
      likesCount: 0,
      createdAt: new Date(),
      editedAt: null,
      author: { id: 'a', name: 'ana', avatar: null },
      likes: [],
      _count: { comments: 0 },
    });
    expect(dto.isLiked).toBe(false);
  });
});
