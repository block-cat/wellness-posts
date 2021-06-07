import { override, extend } from 'flarum/extend';
import avatar from 'flarum/helpers/avatar';
import DiscussionListItem from 'flarum/components/DiscussionListItem';
import DiscussionList from 'flarum/components/DiscussionList';
import IndexPage from 'flarum/components/IndexPage';
import DiscussionControls from 'flarum/utils/DiscussionControls';
import Dropdown from 'flarum/components/Dropdown';
import Link from 'flarum/components/Link';
import listItems from 'flarum/helpers/listItems';
import highlight from 'flarum/helpers/highlight';
import icon from 'flarum/helpers/icon';
import abbreviateNumber from 'flarum/utils/abbreviateNumber';
import classList from 'flarum/utils/classList';
import humanTime from 'flarum/common/utils/humanTime';
import Tooltip from 'flarum/common/components/Tooltip';

import { escapeRegExp } from 'lodash-es';

app.initializers.add('block-cat/wellness-posts', () => {
  extend(DiscussionList.prototype, 'view', function(view) {
    if (app.current.matches(IndexPage)) {
      view.children[0].attrs.className = 'DiscussionList-discussions--posts';
    }
  });

  override(DiscussionListItem.prototype, 'elementAttrs', function(original) {
    if (app.current.matches(IndexPage)) {
      return {
        className: classList([
          'DiscussionListItem--posts',
          this.active() ? 'active' : '',
          this.attrs.discussion.isHidden() ? 'DiscussionListItem--hidden' : '',
          'ontouchstart' in window ? 'Slidable' : '',
        ]),
      };
    } else {
      return original();
    }
  });

  override(DiscussionListItem.prototype, 'view', function(original) {
    if (app.current.matches(IndexPage)) {
      const discussion = this.attrs.discussion;
      const user = discussion.user();
      const isUnread = discussion.isUnread();
      const isRead = discussion.isRead();
      const showUnread = !this.showRepliesCount() && isUnread;
      let jumpTo = 0;
      const controls = DiscussionControls.controls(discussion, this).toArray();
      const attrs = this.elementAttrs();

      if (this.attrs.params.q) {
        const post = discussion.mostRelevantPost();
        if (post) {
          jumpTo = post.number();
        }

        const phrase = escapeRegExp(this.attrs.params.q);
        this.highlightRegExp = new RegExp(phrase + '|' + phrase.trim().replace(/\s+/g, '|'), 'gi');
      } else {
        jumpTo = Math.min(discussion.lastPostNumber(), (discussion.lastReadPostNumber() || 0) + 1);
      }

      return (
        <div {...attrs}>
          {controls.length
          ? Dropdown.component(
              {
                icon: 'fas fa-ellipsis-v',
                className: 'DiscussionListItem-controls',
                buttonClassName: 'Button Button--icon Button--flat Slidable-underneath Slidable-underneath--right',
              },
              controls
            )
          : ''}

          <span
            className={'Slidable-underneath Slidable-underneath--left Slidable-underneath--elastic' + (isUnread ? '' : ' disabled')}
            onclick={this.markAsRead.bind(this)}
          >
            {icon('fas fa-check')}
          </span>

          <div className={'DiscussionListItem-content--posts Slidable-content' + (isUnread ? ' unread' : '') + (isRead ? ' read' : '')}>
            <Tooltip
              text={app.translator.trans('core.forum.discussion_list.started_text', { user: user, ago: humanTime(discussion.createdAt()) })}
              position="left"
            >
              <Link
                href={user ? app.route.user(user) : '#'}
                className="DiscussionListItem-author--posts"
              >
                {avatar(user, { title: '' })}
              </Link>
            </Tooltip>

            <ul className="DiscussionListItem-badges--posts badges">{listItems(discussion.badges().toArray())}</ul>

            <Link href={app.route.discussion(discussion, jumpTo)} className="DiscussionListItem-main--posts">
              <h3 className="DiscussionListItem-title--posts">{highlight(discussion.title(), this.highlightRegExp)}</h3>
              <ul className="DiscussionListItem-info--posts">{listItems(this.infoItems().toArray())}</ul>
            </Link>

            <span
              tabindex="0"
              role="button"
              className="DiscussionListItem-count--posts"
              onclick={this.markAsRead.bind(this)}
              title={showUnread ? app.translator.trans('core.forum.discussion_list.mark_as_read_tooltip') : ''}
            >
              {abbreviateNumber(discussion[showUnread ? 'unreadCount' : 'replyCount']())}
            </span>
          </div>
        </div>
      );
    }
    else {
      return original();
    }
  });
});
