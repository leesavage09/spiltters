const DEFAULT_SKIP = 0;
const DEFAULT_TAKE = 20;

export const parsePagination = (
  skip?: string,
  take?: string,
): { skip: number; take: number } => ({
  skip: parseInt(skip || String(DEFAULT_SKIP), 10),
  take: parseInt(take || String(DEFAULT_TAKE), 10),
});
