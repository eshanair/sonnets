// Common function words filtered out of echo-search scoring so matches surface
// on distinctive shared vocabulary rather than incidental filler words.
export const STOPWORDS = new Set([
  'a', 'an', 'the',
  'and', 'or', 'but', 'nor', 'for', 'so', 'yet',
  'of', 'to', 'in', 'on', 'at', 'by', 'with', 'from', 'as', 'into', 'upon', 'unto', 'within', 'without',
  'i', 'me', 'my', 'mine', 'myself',
  'thou', 'thee', 'thy', 'thine', 'thyself',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'we', 'us', 'our', 'ours', 'ourselves',
  'you', 'your', 'yours', 'yourself', 'they', 'them', 'their', 'theirs', 'themselves',
  'this', 'that', 'these', 'those',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing',
  'shall', 'should', 'will', 'would', 'can', 'could', 'may', 'might', 'must', 'ought',
  'not', 'no', 'nor',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'only', 'own', 'same', 'than', 'too', 'very', 'just',
  'if', 'when', 'where', 'while', 'then', 'there', 'here', 'yet', 'still',
  'what', 'which', 'who', 'whom', 'whose', 'why', 'how',
  'art', 'wilt', 'hath', 'doth', 'dost', 'canst', 'shalt', 'wert', 'hast',
  'o', 'ah', 'yea', 'nay', 'now', 'even', 'ere', 'thus', 'though', 'therefore',
]);
