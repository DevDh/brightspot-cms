/** Rich text editor based on wysihtml5. */
(function($, win, undef) {

var $win = $(win),
        doc = win.document;

$.each(CSS_CLASS_GROUPS, function() {
    var command = 'cms-' + this.internalName;
    var prefix = command + '-';
    var regex = new RegExp(prefix + '[0-9a-z\-]+', 'g');

    wysihtml5.commands[command] = {
        'exec': function(composer, command, optionsString) {
            var options = optionsString ? $.parseJSON(optionsString) : { };
            var tag = options.tag || 'span';
            var format = tag === 'span' ? 'formatInline' : 'formatBlock';
            return wysihtml5.commands[format].exec(composer, command, tag, prefix + options.internalName, regex);
        },

        'state': function(composer, command, optionsString) {
            var options = optionsString ? $.parseJSON(optionsString) : { };
            var tag = options.tag || 'span';
            var format = tag === 'span' ? 'formatInline' : 'formatBlock';
            return wysihtml5.commands[format].state(composer, command, tag , prefix + options.internalName, regex);
        }
    };
});

var $createToolbarGroup = function(label) {
    var $group = $('<span/>', { 'class': 'rte-group', 'data-group-name': label });
    var $label = $('<span/>', { 'class': 'rte-group-label', 'text': label });
    var $buttons = $('<span/>', { 'class': 'rte-group-buttons' });
    $group.append($label);
    $group.append($buttons);
    return $group;
};

var $createToolbarCommand = function(label, command) {
    return $('<span/>', {
        'class': 'rte-button rte-button-' + command,
        'data-wysihtml5-command': command,
        'text': label
    });
};

var createToolbar = function(rte, inline, firstDraft) {
    var $container = $('<div/>', { 'class': 'rte-toolbar-container' });

    var $toolbar = $('<div/>', { 'class': 'rte-toolbar' });
    $container.append($toolbar);

    var $font = $createToolbarGroup('Font');
    $toolbar.append($font);
    $font = $font.find('.rte-group-buttons');

    $font.append($createToolbarCommand('Bold', 'bold'));
    $font.append($createToolbarCommand('Italic', 'italic'));
    $font.append($createToolbarCommand('Underline', 'underline'));
    $font.append($createToolbarCommand('Strike', 'strike'));
    $font.append($createToolbarCommand('Superscript', 'superscript'));
    $font.append($createToolbarCommand('Subscript', 'subscript'));

    $.each(CSS_CLASS_GROUPS, function() {
        var $group = $createToolbarGroup(this.displayName);
        var command = 'cms-' + this.internalName;

        if (this.dropDown) {
            $group.addClass('rte-group-dropDown');
        }

        $group.addClass('rte-group-cssClass');
        $group.addClass('rte-group-cssClass-' + this.internalName);
        $toolbar.append($group);
        $group = $group.find('.rte-group-buttons');

        $.each(this.cssClasses, function() {
            var $cssClass = $createToolbarCommand(this.displayName, command);
            $cssClass.attr('data-wysihtml5-command-value', JSON.stringify(this));
            $group.append($cssClass);
        });
    });

    if (!inline) {
        var $alignment = $createToolbarGroup('Alignment') ;
        $toolbar.append($alignment);
        $alignment = $alignment.find('.rte-group-buttons');

        $alignment.append($createToolbarCommand('Justify Left', 'textAlign').attr('data-wysihtml5-command-value', 'left'));
        $alignment.append($createToolbarCommand('Justify Center', 'textAlign').attr('data-wysihtml5-command-value', 'center'));
        $alignment.append($createToolbarCommand('Justify Right', 'textAlign').attr('data-wysihtml5-command-value', 'right'));

        var $list = $createToolbarGroup('List');
        $toolbar.append($list);
        $list = $list.find('.rte-group-buttons');

        $list.append($createToolbarCommand('Unordered List', 'insertUnorderedList'));
        $list.append($createToolbarCommand('Ordered List', 'insertOrderedList'));
    }

    var $enhancement = $createToolbarGroup('Enhancement');
    $toolbar.append($enhancement);
    $enhancement = $enhancement.find('.rte-group-buttons');

    $enhancement.append($('<span/>', {
        'class': 'rte-button rte-button-link',
        'text': 'Link'
    }));

    if (!inline) {
        $enhancement.append($createToolbarCommand('Enhancement', 'insertEnhancement'));
        $enhancement.append($createToolbarCommand('Marker', 'insertMarker'));
    }

    if (win.cmsRteImportOptions && win.cmsRteImportOptions.length > 0) {
        var $importGroup = $createToolbarGroup('Import');

        $importGroup.addClass('rte-group-dropDown');
        $toolbar.append($importGroup);

        $importGroup = $importGroup.find('.rte-group-buttons');

        $.each(win.cmsRteImportOptions, function(i, importOptions) {
            $importGroup.append($('<span/>', {
                'class': 'rte-button rte-button-import',
                'text': importOptions.name,
                'click': function() {
                    var $button = $(this);

                    google.load('picker', '1', {
                        'callback': function() {
                            new google.picker.PickerBuilder().
                                    enableFeature(google.picker.Feature.NAV_HIDDEN).
                                    setAppId(importOptions.clientId).
                                    setOAuthToken(importOptions.accessToken).
                                    addView(google.picker.ViewId.DOCUMENTS).
                                    setCallback(function(data) {
                                        if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
                                            $.ajax({
                                                'method': 'get',
                                                'url': '/social/googleDriveFile',
                                                'data': { 'id': data[google.picker.Response.DOCUMENTS][0][google.picker.Document.ID] },
                                                'cache': false,
                                                'success': function(data) {
                                                    rte.composer.setValue(data, true);
                                                    rte.composer.parent.updateOverlay();
                                                }
                                            });
                                        }
                                    }).
                                    build().
                                    setVisible(true);
                        }
                    });
                }
            }));
        });
    }

    /*
    var $track = $createToolbarGroup('Track');
    $toolbar.append($track);
    $track = $track.find('.rte-group-buttons');

    if (!firstDraft) {
        $track.append($createToolbarCommand('Changes', 'trackChanges'));
        $track.append($createToolbarCommand('All Comments', 'allComments'));
    }

    $track.append($('<span/>', {
        'class': 'rte-button rte-button-annotate',
        'text': 'Annotate'
    }));
    */

    var $misc = $createToolbarGroup('Misc');
    $toolbar.append($misc);
    $misc = $misc.find('.rte-group-buttons');

    $misc.append($('<span/>', {
        'class': 'rte-button rte-button-html',
        'data-wysihtml5-action': 'change_view',
        'text': 'HTML'
    }));

    $misc.append($createToolbarCommand('Fullscreen', 'fullscreen'));

    return $container[0];
};

var $createEnhancementAction = function(label, action) {
    return $('<span/>', {
        'class': 'rte-button rte-button-' + action,
        'data-action': action,
        'text': label
    });
};

var createEnhancement = function() {
    var $enhancement = $('<div/>', { 'class': 'rte-enhancement' });

    var $toolbar = $('<div/>', { 'class': 'rte-toolbar' });
    $enhancement.append($toolbar);

    var $position = $createToolbarGroup('Position');
    $toolbar.append($position);

    $position.append($createEnhancementAction('Move Left', 'moveLeft'));
    $position.append($createEnhancementAction('Move Up', 'moveUp'));
    $position.append($createEnhancementAction('Move Center', 'moveCenter'));
    $position.append($createEnhancementAction('Move Down', 'moveDown'));
    $position.append($createEnhancementAction('Move Right', 'moveRight'));

    var $misc = $createToolbarGroup('Misc');
    $toolbar.append($misc);

    $misc.append($('<span/>', {
        'class': 'rte-button rte-button-editEnhancement',
        'html': $('<a/>', {
            'href': CONTEXT_PATH + '/content/enhancement.jsp?id=',
            'target': 'contentEnhancement',
            'text': 'Edit'
        })
    }));

    $misc.append($createEnhancementAction('Remove', 'remove'));
    $misc.append($createEnhancementAction('Restore', 'restore'));
    $misc.append($createEnhancementAction('Remove Completely', 'removeCompletely'));

    $enhancement.append($('<div/>', { 'class': 'rte-enhancement-label' }));

    return $enhancement[0];
};

var createMarker = function() {
    var $marker = $('<div/>', { 'class': 'rte-enhancement rte-marker' });

    var $toolbar = $('<div/>', { 'class': 'rte-toolbar' });
    $marker.append($toolbar);

    var $position = $createToolbarGroup('Position');
    $toolbar.append($position);

    $position.append($createEnhancementAction('Move Up', 'moveUp'));
    $position.append($createEnhancementAction('Move Down', 'moveDown'));

    var $misc = $createToolbarGroup('Misc');
    $toolbar.append($misc);

    $misc.append($('<span/>', {
        'class': 'rte-button rte-button-selectMarker',
        'html': $('<a/>', {
            'href': CONTEXT_PATH + '/content/marker.jsp',
            'target': 'contentEnhancement',
            'text': 'Select'
        })
    }));

    $misc.append($createEnhancementAction('Remove', 'remove'));
    $misc.append($createEnhancementAction('Restore', 'restore'));
    $misc.append($createEnhancementAction('Really Remove', 'removeCompletely'));

    $marker.append($('<div/>', { 'class': 'rte-enhancement-label' }));

    return $marker[0];
};

// Wrap wysihtml5 to add functionality.
var rtes = [ ],
        getEnhancementId;

(function() {
    var enhancementIndex = 0;

    getEnhancementId = function(placeholder) {
        var enhancementId = $.data(placeholder, 'rte-enhancement-id');

        if (!enhancementId) {
            ++ enhancementIndex;
            enhancementId = 'rte-enhancement-' + enhancementIndex;
            $.data(placeholder, 'rte-enhancement-id', enhancementId);
        }

        return enhancementId;
    };
})();

var Rte = wysihtml5.Editor.extend({

    'constructor': function(originalTextarea, config) {
        var rte = this,
                firstDraft = $(originalTextarea).attr('data-first-draft') === 'true';

        // Create container.
        var container = this.container = doc.createElement('div');
        container.className = 'rte-container';
        originalTextarea.parentNode.insertBefore(container, originalTextarea);

        // Create overlay.
        var overlay = this.overlay = doc.createElement('div');
        overlay.className = 'rte-overlay';
        overlay.style.position = 'relative';
        overlay.style.left = '0px';
        overlay.style.top = '0px';
        container.appendChild(overlay);

        $(overlay).on('click', function() {
            rte.focus();
        });

        // Create toolbar?
        if (typeof config.toolbar === 'function') {
            config.toolbar = config.toolbar(rte, config.inline, firstDraft);
            container.appendChild(config.toolbar);
        }

        // Handle toolbar action clicks.
        $(overlay).delegate('[data-action]', 'click', function() {
            var $button = $(this);
            var $enhancement = $button.closest('.rte-enhancement');
            var $placeholder = $enhancement.data('$rte-placeholder');
            var action = $button.attr('data-action');

            if (action == 'remove') {
                $enhancement.addClass('state-removing');
                $placeholder.addClass('state-removing');

            } else if (action == 'restore') {
                $enhancement.removeClass('state-removing');
                $placeholder.removeClass('state-removing');

            } else if (action == 'removeCompletely') {
                $enhancement.remove();
                $placeholder.remove();

            } else if (action === 'moveCenter') {
                $placeholder.removeAttr('data-alignment');

            } else if (action === 'moveLeft') {
                $placeholder.attr('data-alignment', 'left');

            } else if (action === 'moveRight') {
                $placeholder.attr('data-alignment', 'right');

            } else {
                var oldTop = $placeholder.offset().top;
                var $parent, $prev, $next;

                if (action === 'moveDown') {
                    $placeholder.closest('body').find('br + br, h1, h2, h3, h4, h5, h6, p').each(function() {
                        if ($placeholder[0].compareDocumentPosition(this) & Node.DOCUMENT_POSITION_FOLLOWING) {
                            $(this).after($placeholder);
                            return false;
                        }
                    });

                    $win.scrollTop($win.scrollTop() + $placeholder.offset().top - oldTop);

                } else if (action === 'moveUp') {
                    var precedings = [ ],
                            precedingsLength;

                    $placeholder.closest('body').find('br + br, h1, h2, h3, h4, h5, h6, p').each(function() {
                        if ($placeholder[0].compareDocumentPosition(this) & Node.DOCUMENT_POSITION_PRECEDING) {
                            precedings.push(this);
                        }
                    });

                    precedingsLength = precedings.length;

                    if (precedingsLength >= 2) {
                        $(precedings[precedingsLength - 2]).after($placeholder);

                    } else {
                        $placeholder.closest('body').prepend($placeholder);
                    }

                    $win.scrollTop($win.scrollTop() + $placeholder.offset().top - oldTop);
                }
            }

            rte.updateOverlay();

            return false;
        });

        // Create dialogs.
        var $dialogs = $('<div/>', {
            'class': 'rte-dialogs',
            'css': {
                'left': 0,
                'position': 'relative',
                'top': 0
            }
        });

        var $linkDialog = $(
                '<div>' +
                    '<h2>Link</h2>' +
                    '<div class="rte-dialogLine"><input type="text" class="rte-dialogLinkHref"></div>' +
                    '<div class="rte-dialogLine">' +
                        '<select class="rte-dialogLinkTarget">' +
                            '<option value="">Same Window</option>' +
                            '<option value="_blank">New Window</option>' +
                        '</select>' +
                        ' <select class="rte-dialogLinkRel">' +
                            '<option value="">Relation</option>' +
                            '<option value="nofollow">nofollow</option>' +
                        '</select>' +
                    '</div>' +
                    '<a class="rte-dialogLinkSave">Save</a>' +
                    ' <a class="rte-dialogLinkOpen" target="_blank">Open</a>' +
                    ' <a class="rte-dialogLinkUnlink">Unlink</a>' +
                '</div>');

        var $lastAnchor = $();

        $linkDialog.on('click', '.rte-dialogLinkSave', function() {
            var target = $linkDialog.find('.rte-dialogLinkTarget').val(),
                    rel = $linkDialog.find('.rte-dialogLinkRel').val();

            $lastAnchor.attr('href', $linkDialog.find('.rte-dialogLinkHref').val() || '');

            if (target) {
                $lastAnchor.attr('target', target);

            } else {
                $lastAnchor.removeAttr('target');
            }

            if (rel) {
                $lastAnchor.attr('rel', rel);

            } else {
                $lastAnchor.removeAttr('rel');
            }

            $linkDialog.popup('close');
        });

        $linkDialog.on('keydown', '.rte-dialogLinkHref', function(event) {
            if (event.which === 13) {
                $linkDialog.find('.rte-dialogLinkSave').click();
                return false;

            } else {
                return true;
            }
        });

        $linkDialog.on('input', '.rte-dialogLinkHref', function(event) {
            $linkDialog.find('.rte-dialogLinkOpen').attr('href', $(event.target).val());
        });

        $linkDialog.on('click', '.rte-dialogLinkUnlink', function() {
            $lastAnchor.after($lastAnchor.html());
            $lastAnchor.remove();
            $linkDialog.popup('close');
        });

        $(doc.body).append($linkDialog);
        $linkDialog.popup();
        $linkDialog.popup('close');

        var openLinkDialog = function($anchor) {
            var composerOffset = $(rte.composer.iframe).offset(),
                    $href = $linkDialog.find('.rte-dialogLinkHref'),
                    $popup,
                    popupWidth,
                    anchorOffset = $anchor.offset(),
                    left,
                    leftDelta;

            $lastAnchor = $anchor;

            $linkDialog.popup('open');
            $href.val($anchor.attr('href') || 'http://');
            $linkDialog.find('.rte-dialogLinkTarget').val($anchor.attr('target') || '');
            $linkDialog.find('.rte-dialogLinkRel').val($anchor.attr('rel') || '');
            $linkDialog.find('.rte-dialogLinkOpen').attr('href', $href.val());
            $href.focus();

            $popup = $linkDialog.popup('container');
            popupWidth = $popup.outerWidth();
            left = anchorOffset.left + ($anchor.outerWidth() - popupWidth) / 2;

            if (left < 35) {
                left = 35;

            } else {
                leftDelta = left + popupWidth - $(doc).width() + 35;

                if (leftDelta > 0) {
                    left -= leftDelta;
                }
            }

            $popup.css({
                'left': left,
                'margin-left': 0,
                'position': 'absolute',
                'top': composerOffset.top + $anchor.offset().top + $anchor.outerHeight()
            });
        };

        (function() {
            var tempIndex = 0;

            $(config.toolbar).find('.rte-button-link').click(function() {
                var tempClass,
                        $anchor;

                ++ tempIndex;
                tempClass = 'rte-link-temp-' + tempIndex;

                wysihtml5.commands.createLink.exec(rte.composer, 'createLink', { 'class': tempClass });

                $anchor = $('a.' + tempClass, rte.composer.element);

                $anchor.removeClass(tempClass);
                openLinkDialog($anchor);
            });
        })();

        var getAnnotations = function($element) {
            return $.parseJSON($element.attr('data-annotations') || '[]');
        };

        var setAnnotations = function($element, annotations) {
            var annotationsLength = annotations.length,
                    allComments,
                    lastAnnotation;

            $element.attr('data-annotations', JSON.stringify(annotations));
            $element.removeAttr('data-last-annotation');

            if (annotationsLength > 0) {
                allComments = '';
                lastAnnotation = annotations[annotationsLength - 1];

                $.each(annotations, function(i, annotation) {
                    allComments += annotation.text;
                    allComments += ' -';
                    allComments += annotation.user;
                    allComments += ', ';
                });

                $element.attr('data-all-comments', allComments.substring(0, allComments.length - 2));
                $element.attr('data-last-comment', lastAnnotation.text + ' -' + lastAnnotation.user);
            }
        };

        var addAnnotation = function($element, text) {
            var annotations = getAnnotations($element),
                    annotationsLength = annotations.length,
                    lastAnnotation,
                    userId = $(rte.textarea.element).attr('data-user-id'),
                    user = $(rte.textarea.element).attr('data-user'),
                    addAnnotation = true;

            if (!$element.is('code, del, ins')) {
                $element = $('<code/>');

                rte.composer.selection.insertNode($element[0]);
            }

            if (annotationsLength > 0) {
                lastAnnotation = annotations[annotationsLength - 1];

                if (userId === lastAnnotation.userId) {
                    lastAnnotation.text = text;
                    addAnnotation = false;
                }
            }

            if (addAnnotation) {
                annotations.push({
                    'time': +new Date(),
                    'userId': userId,
                    'user': user,
                    'text': text
                });
            }

            setAnnotations($element, annotations);
        };

        var $annotationDialog = $(
                '<div>' +
                    '<div class="rte-dialogAnnotationChange">' +
                        '<h2>The Change</h2>' +
                        '<div class="rte-dialogAnnotationMessage"></div>' +
                        '<a class="rte-dialogAnnotationAccept">Accept</a>' +
                        ' <a class="rte-dialogAnnotationRevert">Revert</a>' +
                    '</div>' +
                    '<div class="rte-dialogAnnotationChangeAll">' +
                        '<h2>All Changes</h2>' +
                        '<a class="rte-dialogAnnotationAcceptAll">Accept All</a>' +
                        ' <a class="rte-dialogAnnotationRevertAll">Revert All</a>' +
                    '</div>' +
                    '<h2>Comment</h2>' +
                    '<input type="text" class="rte-dialogAnnotationText">' +
                    '<a class="rte-dialogAnnotationSave">Save</a>' +
                    '<ul class="rte-dialogAnnotationTexts">' +
                    '</ul>' +
                '</div>');

        var $lastSelected = $();

        $annotationDialog.on('click', '.rte-dialogAnnotationAccept', function() {
            if ($lastSelected.is('del')) {
                $lastSelected.remove();

            } else if ($lastSelected.is('ins')) {
                $lastSelected.before($lastSelected.html());
                $lastSelected.remove();
            }

            $(this).popup('close');
        });

        $annotationDialog.on('click', '.rte-dialogAnnotationAcceptAll', function() {
            $(rte.composer.element).find('ins').each(function() {
                var $ins = $(this);

                $ins.before($ins.html());
                $ins.remove();
            });

            $(rte.composer.element).find('del').remove();
            $(this).popup('close');
        });

        $annotationDialog.on('click', '.rte-dialogAnnotationRevert', function() {
            if ($lastSelected.is('del')) {
                $lastSelected.before($lastSelected.html());
                $lastSelected.remove();

            } else if ($lastSelected.is('ins')) {
                $lastSelected.remove();
            }

            $(this).popup('close');
        });

        $annotationDialog.on('click', '.rte-dialogAnnotationRevertAll', function() {
            $(rte.composer.element).find('del').each(function() {
                var $del = $(this);

                $del.before($del.html());
                $del.remove();
            });

            $(rte.composer.element).find('ins').remove();
            $(this).popup('close');
        });

        $annotationDialog.on('keydown', '.rte-dialogAnnotationText', function(event) {
            if (event.which === 13) {
                $annotationDialog.find('.rte-dialogAnnotationSave').click();
                return false;

            } else {
                return true;
            }
        });

        $annotationDialog.on('click', '.rte-dialogAnnotationSave', function() {
            addAnnotation($lastSelected, $annotationDialog.find('.rte-dialogAnnotationText').val());
            $(this).popup('close');
        });

        $(doc.body).append($annotationDialog);
        $annotationDialog.popup();
        $annotationDialog.popup('close');

        var openAnnotationDialog = function($selected) {
            var composerOffset = $(rte.composer.iframe).offset(),
                    $cursor,
                    cursorOffset,
                    $change = $annotationDialog.find('.rte-dialogAnnotationChange'),
                    $message = $annotationDialog.find('.rte-dialogAnnotationMessage'),
                    annotations = getAnnotations($selected),
                    $texts = $annotationDialog.find('.rte-dialogAnnotationTexts'),
                    lastAnnotation;

            $lastSelected = $selected;

            if ($selected.is('del')) {
                $change.show();
                $message.html('Deleted <q>' + $selected.html() + '</q>');

            } else if ($selected.is('ins')) {
                $change.show();
                $message.html('Inserted <q>' + $selected.html() + '</q>');

            } else {
                $change.hide();
            }

            $annotationDialog.popup('open');
            $annotationDialog.find('.rte-dialogAnnotationText').focus();

            $cursor = $(rte.composer.element).find('.rte-cursor');
            cursorOffset = $cursor.offset();

            $annotationDialog.popup('container').css({
                'position': 'absolute',
                'top': composerOffset.top + cursorOffset.top + $cursor.outerHeight()
            });

            $texts.empty();
            $.each(annotations.reverse(), function(i, annotation) {
                var html = '';

                if (!lastAnnotation) {
                    lastAnnotation = annotation;
                }

                if (annotation.text) {
                    html += '<q>' + annotation.text + '</q> said ';
                }

                html += annotation.user;
                html += ' at ';
                html += new Date(parseInt(annotation.time, 10));

                $texts.append($('<li/>', {
                    'html': html
                }));
            });

            $texts.toggle(!!lastAnnotation);
            $annotationDialog.find('.rte-dialogAnnotationText').val(
                    lastAnnotation && lastAnnotation.userId === $(rte.textarea.element).attr('data-user-id') ? lastAnnotation.text || '' : '');
        };

        $(config.toolbar).find('.rte-button-annotate').click(function() {
            openAnnotationDialog(getSelectedElement());
        });

        // Initialize wysihtml5.
        container.appendChild(originalTextarea);
        originalTextarea.className += ' rte-textarea';

        rtes[rtes.length] = this;
        this.base(originalTextarea, config);

        var getSelectedElement = function() {
            var range = rte.composer.selection.getRange(),
                    selected = rte.composer.selection.getSelectedNode(),
                    $next;

            if (range.collapsed &&
                    selected.nodeType == 3 &&
                    selected.length == range.endOffset) {
                $next = $(selected.nextSibling);

                if ($next.is('.rte-cursor')) {
                    $next = $($next[0].nextSibling);
                }

                if ($next.is('code, del, ins')) {
                    return $next;
                }
            }

            while (!selected.tagName) {
                selected = selected.parentNode;
            }

            return $(selected);
        };

        this.observe('show:dialog', function(options) {
            var $selected = getSelectedElement(),
                    selectedOffset = $selected.offset(),
                    $dialog = $(options.dialogContainer);

            $dialog.css({
                'left': selectedOffset.left,
                'position': 'absolute',
                'top': selectedOffset.top + $selected.outerHeight() + 10
            });
        });

        this.observe('load', function() {
            var $cursor;

            $annotationDialog.popup('container').bind('open', function() {
                var selection = rte.composer.selection;

                if (!$cursor) {
                    $cursor = $(rte.composer.doc.createElement('span'));
                    $cursor.addClass('rte-cursor');
                }

                selection.getSelection().collapseToEnd();
                selection.insertNode($cursor[0]);
                selection.setBefore($cursor[0]);
            });

            $annotationDialog.popup('container').bind('close', function() {
                if ($cursor) {
                    rte.composer.selection.setBefore($cursor[0]);
                    $cursor.remove();
                    $cursor = null;
                    rte.focus();
                }
            });

            // Make sure placeholder BUTTONs are replaced with enhancement SPANs.
            var convertNodes = function(parent, oldTagName, newTagName, callback) {
                var childNodes = parent.childNodes;

                if (parent.childNodes) {
                    var childNodesLength = childNodes.length;

                    for (var i = 0; i < childNodesLength; ++ i) {
                        var node = childNodes[i];

                        if (node &&
                                node.tagName &&
                                node.tagName === oldTagName &&
                                wysihtml5.dom.hasClass(node, 'enhancement')) {
                            var newNode = parent.ownerDocument.createElement(newTagName);
                            var nodeAttributes = node.attributes;
                            var nodeAttributesLength = nodeAttributes.length;

                            for (var j = 0; j < nodeAttributesLength; ++ j) {
                                var attribute = nodeAttributes[j];
                                newNode.setAttribute(attribute.name, attribute.value);
                            }

                            if (callback) {
                                callback(newNode);
                            }

                            parent.insertBefore(newNode, node);
                            parent.removeChild(node);

                        } else {
                            convertNodes(node, oldTagName, newTagName, callback);
                        }
                    }
                }
            };

            var textarea = this.textarea;
            var lastTextareaValue;

            if (!$(textarea.element).val()) {
                $(textarea.element).val('<br>');
            }

            textarea._originalGetValue = textarea.getValue;
            textarea.getValue = function(parse) {
                var value = this._originalGetValue(parse),
                        dom;

                if (lastTextareaValue === value) {
                    return value;

                } else {
                    lastTextareaValue = value;
                    dom = wysihtml5.dom.getAsDom(value, this.element.ownerDocument);
                    convertNodes(dom, 'SPAN', 'BUTTON');
                    return dom.innerHTML;
                }
            };

            var composer = this.composer;
            var lastComposerValue;

            composer._originalGetValue = composer.getValue;
            composer.getValue = function(parse) {
                var value = this._originalGetValue(parse);

                if (lastComposerValue === value) {
                    return value;

                } else {
                    lastComposerValue = value;
                    dom = wysihtml5.dom.getAsDom(value, this.element.ownerDocument);
                    convertNodes(dom, 'BUTTON', 'SPAN', function(node) {
                        node.innerHTML = 'Enhancement';
                    });
                    return dom.innerHTML;
                }
            };

            composer.setValue(textarea.getValue());

            /*
            // Legacy annotation support.
            $(composer.element).find('[data-comment], [data-text]').each(function() {
                var $element = $(this);

                $element.attr('data-annotations', JSON.stringify([ {
                    'time': $element.attr('data-time'),
                    'userId': $element.attr('data-user-id'),
                    'user': $element.attr('data-user'),
                    'text': $element.attr('data-comment') || $element.attr('data-text')
                } ]));

                $element.removeAttr('data-time');
                $element.removeAttr('data-user-id');
                $element.removeAttr('data-user');
                $element.removeAttr('data-comment');
                $element.removeAttr('data-text');
            });

            $(composer.element).find('[data-comments]').each(function() {
                var $element = $(this);

                $element.attr('data-annotations', $element.attr('data-comments'));
                $element.removeAttr('data-comments');
            });

            $(composer.element).find('[data-annotations]').each(function() {
                var $element = $(this),
                        annotations = getAnnotations($element);

                setAnnotations($element, annotations);
            });

            // Some style clean-ups.
            composer.iframe.style.overflow = 'hidden';
            composer.iframe.contentDocument.body.style.overflow = 'hidden';
            composer.iframe.contentDocument.body.className += ' rte-loaded';
            textarea.element.className += ' rte-source';

            // Make sure only one toolbar is visible at a time.
            if (this !== rtes[0]) {
                this.toolbar.hide();
            }

            this.on('focus', function() {
                $(textarea.element).parentsUntil('form').addClass('state-focus');

                for (var i = 0, length = rtes.length; i < length; ++ i) {
                    var rte = rtes[i];

                    $(rte.container).css('padding-top', 0);
                    $(rte.config.toolbar).removeClass('rte-toolbar-fixed');
                    $(rte.config.toolbar).attr('style', rte._toolbarOldStyle);
                    $(rte.overlay).css('top', 0);
                    rte._toolbarOldStyle = null;
                    rte.toolbar.hide();
                }

                this.toolbar.show();
                $(this.overlay).css('top', $(this.config.toolbar).outerHeight());
                $annotationDialog.popup('close');
            });

            // Hack to make sure that the proper focus fires when clicking
            // on an 'empty' region.
            $(composer.iframe.contentWindow).on('focus', function() {
                rte.focus();
            });

            this.on('blur', function() {
                $(textarea.element).parentsUntil('form').removeClass('state-focus');
                $(textarea.element).trigger('change');
            });

            $(composer.element).on('click', 'a', function(event) {
                openLinkDialog($(event.target));
            });

            $(composer.element).on('dblclick', 'del, ins, [data-annotations]', function(event) {
                openAnnotationDialog($(event.target));
            });

            // Track changes.
            if (firstDraft) {
                $(composer.element).addClass('rte-firstDraft');

            } else {
                var IGNORE_KEYS = [ 16, 17, 18, 37, 38, 39, 40, 91 ],
                        downRange,
                        collapseSelection,
                        wrap,
                        wrapInDel,
                        tempIndex = 0,
                        handleDelete;

                // Move the cursor to the beginning or the end of the selection.
                collapseSelection = function(selection, direction) {
                    if (direction === 'forward') {
                        selection.getSelection().collapseToEnd();

                    } else {
                        selection.getSelection().collapseToStart();
                    }
                };

                wrap = function(tag) {
                    var tempClass,
                            $element,
                            annotations,
                            oldAnnotations,
                            prev,
                            $prev,
                            next,
                            $next,
                            newAnnotations;

                    if (wysihtml5.commands.formatInline.state(composer, null, tag)) {
                        return;
                    }

                    ++ tempIndex;
                    tempClass = 'rte-wrap-temp-' + tempIndex;

                    wysihtml5.commands.formatInline.exec(composer, null, tag, tempClass, /foobar/g);

                    $element = $(tag + '.' + tempClass, composer.element);

                    addAnnotation($element, '');
                    $element.removeClass(tempClass);

                    for (; (next = $element[0].nextSibling); $element = $next) {
                        $next = $(next);

                        if (!$next.is(tag)) {
                            break;
                        }

                        $next.prepend($element.html());
                        $element.remove();

                        annotations = $element.attr('data-annotations');

                        if (annotations) {
                            oldAnnotations = $next.attr('data-annotations');

                            if (oldAnnotations) {
                                newAnnotations = $.parseJSON(oldAnnotation);
                                newAnnotations.push($.parseJSON(annotations)[0]);
                                $next.attr('data-annotations', JSON.stringify(newAnnotations));
                            }
                        }
                    }
                };

                // Wrap the current selection in <del>.
                wrapInDel = function(direction) {
                    var selection = composer.selection,
                            range;

                    wrap('del');

                    // <del> shouldn't contain any <ins>s.
                    $.each(selection.getNodes(1, function(node) {
                        return node.tagName.toLowerCase() === 'ins';

                    }), function(i, ins) {
                        $(ins).remove();
                    });

                    collapseSelection(selection, direction);
                };

                // Handle different types of delete key presses.
                handleDelete = function(selection, range, direction) {

                    // Let the delete go through within <ins>.
                    if ($(selection.getSelectedNode()).closest('ins').length > 0) {
                        return true;

                    // Wrap the character before or after the cursor in <del>.
                    } else if (range.collapsed) {
                        selection.getSelection().nativeSelection.modify('extend', direction, 'character');
                        wrap('del');
                        collapseSelection(selection, direction);

                    // Wrap the selection in <del>.
                    } else {
                        wrapInDel(direction);
                    }

                    return false;
                };

                $(composer.element).bind('keydown', function(event) {
                    var which = event.which,
                            selection = composer.selection,
                            range = selection.getRange();

                    // BACKSPACE.
                    if (which === 8) {
                        return handleDelete(selection, range, 'backward');

                    // DELETE.
                    } else if (which === 46) {
                        return handleDelete(selection, range, 'forward');

                    // For any other key, remember the position for later so that
                    // we know where to start wrapping for <ins>.
                    } else if ($.inArray(which, IGNORE_KEYS) < 0) {
                        if (!range.collapsed &&
                                !(event.altKey ||
                                event.ctrlKey ||
                                event.metaKey ||
                                event.shiftKey)) {
                            wrapInDel();
                        }

                        if (!downRange) {
                            downRange = selection.getRange().cloneRange();
                        }

                        return true;
                    }
                });

                $(composer.element).bind('keyup', function(event) {
                    var selection,
                            range,
                            tempClass,
                            $ins;

                    if (!downRange ||
                            $.inArray(event.which, IGNORE_KEYS) >= 0) {
                        return;
                    }

                    selection = composer.selection;
                    range = selection.getRange();

                    selection.executeAndRestore(function() {
                        range.setStart(downRange.startContainer, downRange.startOffset);
                        selection.setSelection(range);
                        wrap('ins');
                    });

                    // Move all <ins>s out of and after the <del>.
                    $(selection.getSelectedNode()).closest('del').each(function() {
                        var $del = $(this),
                                $ins = $del.find('ins'),
                                insLength = $ins.length;

                        if (insLength > 0) {
                            $del.after($ins);
                            selection.setAfter($ins[insLength - 1]);
                        }
                    });

                    downRange = null;
                });

                if (rte.config.trackChanges) {
                    $(composer.element).addClass('rte-trackChanges');
                }
            }
            */

            setInterval(function() {
                rte.updateOverlay();
            }, 100);
        });
    },

    // Updates the overlay to show enhancements above the underlying
    // placeholders.
    'updateOverlay': function() {
        var rte = this,
                textarea = rte.textarea,
                $overlay = $(rte.overlay),
                composer = rte.composer,
                composerIframe = composer.iframe,
                composerWindow = composerIframe.contentWindow,
                $composerBody;

        if (!composerWindow) {
            return;
        }

        $composerBody = $(composerWindow.document.body);

        // Hide if viewing source HTML.
        $overlay.toggle(rte.currentView !== textarea);

        // Automatically size the iframe height to match the content.
        $(composerIframe).css('min-height', $composerBody.height() + (rte.config.inline ? 10 : 40));
        $(composerWindow).scrollTop(0);

        // Overlay enhancements on top of the placeholders in the composer.
        $overlay.children().each(function() {
            $.data(this, 'rte-visited', false);
        });

        $composerBody.find('button.enhancement').each(function() {
            var $placeholder = $(this),
                    isMarker = $placeholder.hasClass('marker'),
                    enhancementId = getEnhancementId(this),
                    $enhancement = $('#' + enhancementId),
                    $editTrigger,
                    placeholderOffset = $placeholder.offset(),
                    $enhancementLabel,
                    newLabel,
                    $oldImage,
                    oldPreview,
                    newPreview;

            // Create the enhancement if it doesn't exist already.
            if ($enhancement.length === 0) {
                $enhancement = $(rte.config[isMarker ? 'marker' : 'enhancement']());

                $enhancement.attr('id', enhancementId);
                $enhancement.css('position', 'absolute');
                $.data($enhancement[0], '$rte-placeholder', $placeholder);
                $overlay.append($enhancement);

                $enhancement.find('.rte-button-editEnhancement a').each(function() {
                    var $anchor = $(this),
                            href = $anchor.attr('href'),
                            id = $placeholder.attr('data-id');

                    href = href.replace(/([?&])id=[^&]*/, '$1');
                    href += '&id=' + (id || '');

                    $anchor.attr('href', href);

                    if (!id) {
                        $editTrigger = $anchor;
                    }
                });
            }

            $.data($enhancement[0], 'rte-visited', true);

            // Position the enhancement to cover the placeholder.
            $enhancement.css({
                'height': $placeholder.outerHeight(),
                'left': placeholderOffset.left,
                'top': placeholderOffset.top,
                'width': $placeholder.outerWidth()
            });

            // Copy the enhancement label.
            $enhancementLabel = $enhancement.find('.rte-enhancement-label');
            newLabel = $placeholder.attr('data-label');
            newPreview = $placeholder.attr('data-preview');

            if (newPreview) {
                if ($enhancementLabel.find('figure img').attr('src') !== newPreview) {
                    $enhancementLabel.html($('<figure/>', {
                        'html': [
                            $('<img/>', {
                                'src': newPreview
                            }),
                            $('<figcaption/>')
                        ]
                    }));
                }

                $enhancementLabel.find('figure img').attr('alt', newLabel);
                $enhancementLabel.find('figure figcaption').text(newLabel);

            } else {
                if (!newLabel) {
                    newLabel = 'Empty ' + (isMarker ? 'Marker' : 'Enhancement');
                }

                $enhancementLabel.text(newLabel);
            }

            if ($editTrigger) {
                $editTrigger.click();
            }
        });

        // Remove orphaned enhancements.
        $overlay.children().each(function() {
            if (!$.data(this, 'rte-visited')) {
                $(this).remove();
            }
        });
    }
});

// Add support for strike command.
wysihtml5.commands.strike = {

    'exec': function(composer, command) {
        return wysihtml5.commands.formatInline.exec(composer, command, 'strike');
    },

    'state': function(composer, command) {
        return wysihtml5.commands.formatInline.state(composer, command, 'strike');
    }
};

var textAlignRegex = /cms-textAlign-[0-9a-z\-]+/g;
wysihtml5.commands.textAlign = {

    'exec': function(composer, command, alignment) {
        return wysihtml5.commands.formatBlock.exec(composer, command, null, 'cms-textAlign-' + alignment, textAlignRegex);
    },

    'state': function(composer, command, alignment) {
        return wysihtml5.commands.formatBlock.state(composer, command, null, 'cms-textAlign-' + alignment, textAlignRegex);
    }
};

// Remove support for insertImage so that it can't be used accidentantly,
// since insertEnhancement supercedes its functionality.
delete wysihtml5.commands.insertImage;

var insertButton = function(composer, button) {
    var $selected = $(composer.selection.getSelectedNode()),
            precedings = [ ],
            precedingsLength;

    $selected.closest('body').find('br + br, h1, h2, h3, h4, h5, h6, p').each(function() {
        if ($selected[0].compareDocumentPosition(this) & Node.DOCUMENT_POSITION_PRECEDING) {
            precedings.push(this);
        }
    });

    precedingsLength = precedings.length;

    if (precedingsLength >= 1) {
        $(precedings[precedingsLength - 1]).after(button);

    } else {
        $selected.closest('body').prepend(button);
    }
};

// Add support for adding an enhancement.
wysihtml5.commands.insertEnhancement = {

    'exec': function(composer, command, value) {
        var doc = composer.doc;
        var button = doc.createElement('BUTTON');

        if (value) {
            for (var i in value) {
                button.setAttribute(i, value[i]);
            }
        }

        button.setAttribute('class', 'enhancement');
        insertButton(composer, button);
    },

    'state': function(composer) {
        return false;
    }
};

// Add support for adding a marker.
wysihtml5.commands.insertMarker = {

    'exec': function(composer, command, value) {
        var doc = composer.doc;
        var button = doc.createElement('BUTTON');

        if (value) {
            for (var i in value) {
                button.setAttribute(i, value[i]);
            }
        }

        button.setAttribute('class', 'enhancement marker');
        insertButton(composer, button);
    },

    'state': function(composer) {
        return false;
    }
};

// Add support for toggling 'Track Changes' mode.
wysihtml5.commands.trackChanges = {

    'exec': function(composer) {
        $(composer.element).toggleClass('rte-trackChanges');
    },

    'state': function(composer) {
        return $(composer.element).hasClass('rte-trackChanges');
    }
};

// Add support for toggling all annotation comments.
wysihtml5.commands.allComments = {

    'exec': function(composer) {
        $(composer.element).toggleClass('rte-allComments');
    },

    'state': function(composer) {
        return $(composer.element).hasClass('rte-allComments');
    }
};

// Add support for toggling 'Fullscreen' mode.
wysihtml5.commands.fullscreen = {

    'exec': function(composer) {
        $('.toolBroadcast').toggle();
        $('.toolHeader').toggle();
        $(composer.parent.container).toggleClass('rte-fullscreen');
        $(composer.element).toggleClass('rte-fullscreen');
        $(doc.body).toggleClass('rte-fullscreen');
    },

    'state': function(composer) {
        return $(composer.element).hasClass('rte-fullscreen');
    }
};

// Expose as a jQuery plugin.
$.plugin2('rte', {
    '_defaultOptions': {
        'enhancement': createEnhancement,
        'iframeSrc': CONTEXT_PATH + '/style/rte-content.jsp',
        'marker': createMarker,
        'style': false,
        'toolbar': createToolbar,
        'useLineBreaks': true,

        'parserRules': {
            'tags': {
                'script': { 'remove': true },
                'style': { 'remove': true },
                'p': {
                    'rename_tag': 'span',
                    'callback': function(node) {
                        var $node = $(node);

                        $node.append($('<br>'));
                        $node.append($('<br>'));
                    }
                }
            }
        }
    },

    '_create': function(element) {
        var $element = $(element),
                options = $.extend(true, { }, this.option()),
                rte;

        if ($element.attr('data-inline') === 'true') {
            options.inline = true;
        }

        if ($element.attr('data-track-changes') === 'true') {
            options.trackChanges = true;
        }

        rte = new Rte(element, options);

        $element.bind('input-disable', function(event, disable) {
            $element.closest('.rte-container').toggleClass('state-disabled', disable);
            rte[disable ? 'disable' : 'enable']();
        });
    },

    'enable': function() {
        var container = this[0];

        if (container) {
            $.each(rtes, function() {
                var textarea = this.textareaElement;
                if (textarea && $.contains(container, textarea)) {
                    this.enable();
                }
            });
        }

        return this;
    },

    // Sets data related to the enhancement.
    'enhancement': function(data) {
        var $enhancement = this.$caller.closest('.rte-enhancement');
        var $placeholder = $enhancement.data('$rte-placeholder');

        if ($placeholder) {
            $.each(data, function(key, value) {
                var name = 'data-' + key;
                if (value === null || value === undef) {
                    $placeholder.removeAttr(name);
                } else {
                    $placeholder.attr(name, value);
                }
            });
        }

        var label = data.label;
        if (label) {
            $enhancement.find('.rte-enhancement-label').text(label);
        }

        return this;
    }
});

// Make sure that the editorial toolbar is visible as long as possible.
$win.bind('resize.rte scroll.rte', $.throttle(100, function() {
    $.each(rtes, function() {
        var $toolbar = $(this.config.toolbar),
                $header,
                headerBottom,
                $container = $(this.container),
                $overlay = $(this.overlay),
                containerTop,
                windowTop;

        if (!$toolbar.is(':visible')) {
            $container.css('padding-top', 0);
            $overlay.css('top', 0);
            return;
        }

        if ($toolbar.closest('.rte-container').length === 0) {
            return;
        }

        $header = $('.toolHeader');
        headerBottom = $header.offset().top + $header.outerHeight() - ($header.css('position') === 'fixed' ? $win.scrollTop() : 0);
        containerTop = $container.offset().top;
        windowTop = $win.scrollTop() + headerBottom;

        // Completely in view.
        if (windowTop < containerTop) {
            $container.css('padding-top', 0);
            $overlay.css('top', $toolbar.outerHeight());
            $toolbar.removeClass('rte-toolbar-fixed');
            $toolbar.attr('style', this._toolbarOldStyle);
            this._toolbarOldStyle = null;

        } else {
            this._toolbarOldStyle = this._toolbarOldStyle || $toolbar.attr('style') || ' ';

            // Partially in view.
            if (windowTop < containerTop + $container.height()) {
                $container.css('padding-top', $toolbar.outerHeight());
                $overlay.css('top', 0);
                $toolbar.addClass('rte-toolbarContainer-fixed');
                $toolbar.css({
                    'left': $toolbar.offset().left,
                    'position': 'fixed',
                    'top': headerBottom,
                    'width': $toolbar.width()
                });

            // Completely out of view.
            } else {
                $toolbar.addClass('rte-toolbarContainer-fixed');
                $toolbar.css({
                    'top': -10000,
                    'position': 'fixed'
                });
            }
        }
    });
}));

}(jQuery, window));
