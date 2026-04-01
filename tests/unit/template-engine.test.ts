import { applyTemplateExpressions } from '@/lib/engine/template-engine';

describe('template engine', () => {
  it('resolves nested template expressions inside objects and arrays', () => {
    const input = {
      title: 'Hello {{story.title}}',
      tags: ['{{story.primaryTag}}', 'static'],
      nested: {
        note: 'Author: {{story.author.name}}'
      }
    };

    const output = applyTemplateExpressions(input, {
      story: {
        title: 'Xtoryteller',
        primaryTag: 'qa',
        author: {
          name: 'Agent'
        }
      }
    }) as typeof input;

    expect(output).toEqual({
      title: 'Hello Xtoryteller',
      tags: ['qa', 'static'],
      nested: {
        note: 'Author: Agent'
      }
    });
  });

  it('removes missing template values without altering surrounding text', () => {
    expect(applyTemplateExpressions('Value: {{story.missing}}', { story: {} })).toBe('Value: ');
  });
});
