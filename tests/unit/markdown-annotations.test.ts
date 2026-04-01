import {
  annotationRemarkPlugin,
  createAnnotationLink,
  parseAnnotationHref,
  splitTextNode,
  transformAnnotationTokens
} from '@/components/_shared/markdown-annotations';

describe('markdown annotations', () => {
  it('converts hover tokens into link nodes', () => {
    expect(createAnnotationLink('leverage-points|Leverage points')).toEqual({
      type: 'link',
      url: 'xt-annotation:leverage-points|Leverage%20points',
      children: [{ type: 'text', value: 'Leverage points' }]
    });
  });

  it('splits markdown text around hover tokens', () => {
    expect(splitTextNode('The {{hover:leverage points}} matter.')).toEqual([
      { type: 'text', value: 'The ' },
      {
        type: 'link',
        url: 'xt-annotation:leverage%20points|leverage%20points',
        children: [{ type: 'text', value: 'leverage points' }]
      },
      { type: 'text', value: ' matter.' }
    ]);
  });

  it('transforms text nodes in-place through the remark helper', () => {
    const tree = {
      type: 'paragraph',
      children: [{ type: 'text', value: 'See {{hover:key|Label}} now.' }]
    };

    annotationRemarkPlugin()(tree);
    expect(tree.children).toHaveLength(3);
  });

  it('parses annotation href payloads', () => {
    expect(parseAnnotationHref('xt-annotation:leverage%20points|Label')).toEqual({
      key: 'leverage points',
      label: 'Label'
    });
    expect(parseAnnotationHref('https://example.com')).toBeNull();
  });
});
