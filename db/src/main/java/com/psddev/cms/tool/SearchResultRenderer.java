package com.psddev.cms.tool;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.UUID;

import javax.servlet.http.HttpServletRequest;

import org.joda.time.DateTime;

import com.psddev.cms.db.Directory;
import com.psddev.cms.db.ImageTag;
import com.psddev.cms.db.Renderer;
import com.psddev.cms.db.Taxon;
import com.psddev.cms.db.ToolUi;
import com.psddev.dari.db.Database;
import com.psddev.dari.db.Metric;
import com.psddev.dari.db.MetricInterval;
import com.psddev.dari.db.ObjectField;
import com.psddev.dari.db.ObjectType;
import com.psddev.dari.db.Predicate;
import com.psddev.dari.db.Recordable;
import com.psddev.dari.db.State;
import com.psddev.dari.util.ImageEditor;
import com.psddev.dari.util.ObjectUtils;
import com.psddev.dari.util.PaginatedResult;
import com.psddev.dari.util.StorageItem;
import com.psddev.dari.util.VideoStorageItem;
import com.psddev.dari.util.StringUtils;

public class SearchResultRenderer {

    private static final String ATTRIBUTE_PREFIX = SearchResultRenderer.class.getName() + ".";
    private static final String PREVIOUS_DATE_ATTRIBUTE = ATTRIBUTE_PREFIX + "previousDate";
    private static final String MAX_SUM_ATTRIBUTE = ATTRIBUTE_PREFIX + ".maximumSum";

    protected final ToolPageContext page;

    @Deprecated
    protected final PageWriter writer;

    protected final Search search;
    protected final ObjectField sortField;
    protected final boolean showTypeLabel;
    protected final PaginatedResult<?> result;

    @SuppressWarnings("deprecation")
    public SearchResultRenderer(ToolPageContext page, Search search) throws IOException {
        this.page = page;
        this.writer = page.getWriter();
        this.search = search;

        ObjectType selectedType = search.getSelectedType();
        PaginatedResult<?> result = null;

        if (search.getSort() == null) {
            search.setSort(ObjectUtils.isBlank(search.getQueryString()) ? "cms.content.updateDate" : Search.RELEVANT_SORT_VALUE);
            search.setShowMissing(true);
        }

        if (selectedType != null) {
            this.sortField = selectedType.getFieldGlobally(search.getSort());
            this.showTypeLabel = selectedType.as(ToolUi.class).findDisplayTypes().size() != 1;

            if (ObjectType.getInstance(ObjectType.class).equals(selectedType)) {
                List<ObjectType> types = new ArrayList<ObjectType>();
                Predicate predicate = search.toQuery(page.getSite()).getPredicate();

                for (ObjectType t : Database.Static.getDefault().getEnvironment().getTypes()) {
                    if (t.is(predicate)) {
                        types.add(t);
                    }
                }

                result = new PaginatedResult<ObjectType>(search.getOffset(), search.getLimit(), types);
            }

        } else {
            this.sortField = Database.Static.getDefault().getEnvironment().getField(search.getSort());
            this.showTypeLabel = search.findValidTypes().size() != 1;
        }

        this.result = result != null ? result : search.toQuery(page.getSite()).select(search.getOffset(), search.getLimit());
    }

    @SuppressWarnings("unchecked")
    public void render() throws IOException {
        boolean resultsDisplayed = false;

        page.writeStart("h2").writeHtml("Result").writeEnd();

        if (ObjectUtils.isBlank(search.getQueryString()) &&
                search.getSelectedType() != null &&
                search.getSelectedType().getGroups().contains(Taxon.class.getName())) {

            List<Taxon> roots = Taxon.Static.getRoots((Class<Taxon>) search.getSelectedType().getObjectClass());

            if (!roots.isEmpty()) {
                resultsDisplayed = true;

                page.writeStart("div", "class", "searchTaxonomy");
                    page.writeStart("ul", "class", "taxonomy");
                        for (Taxon root : roots) {
                            writeTaxon(root);
                        }
                    page.writeEnd();
                page.writeEnd();
            }
        }

        if (!resultsDisplayed) {
            if (search.findSorts().size() > 1) {
                page.writeStart("div", "class", "searchSorter");
                    renderSorter();
                page.writeEnd();
            }

            page.writeStart("div", "class", "searchPagination");
                renderPagination();
            page.writeEnd();

            page.writeStart("div", "class", "searchResultList");
                if (result.hasPages()) {
                    renderList(result.getItems());
                } else {
                    renderEmpty();
                }
            page.writeEnd();
        }

        if (search.isSuggestions() && ObjectUtils.isBlank(search.getQueryString())) {
            String frameName = page.createId();

            page.writeStart("div", "class", "frame", "name", frameName);
            page.writeEnd();

            page.writeStart("form",
                    "class", "searchSuggestionsForm",
                    "method", "post",
                    "action", page.url("/content/suggestions.jsp"),
                    "target", frameName);
                page.writeTag("input",
                        "type", "hidden",
                        "name", "search",
                        "value", ObjectUtils.toJson(search.getState().getSimpleValues()));
            page.writeEnd();
        }
    }

    private void writeTaxon(Taxon taxon) throws IOException {
        page.writeStart("li");
            renderBeforeItem(taxon);
            page.writeObjectLabel(taxon);
            renderAfterItem(taxon);

            Collection<? extends Taxon> children = taxon.getChildren();

            if (children != null && !children.isEmpty()) {
                page.writeStart("ul");
                    for (Taxon c : children) {
                        writeTaxon(c);
                    }
                page.writeEnd();
            }
        page.writeEnd();
    }

    public void renderSorter() throws IOException {
        page.writeStart("form",
                "class", "autoSubmit",
                "method", "get",
                "action", page.url(null));

            for (Map.Entry<String, List<String>> entry : StringUtils.getQueryParameterMap(page.url("",
                    Search.SORT_PARAMETER, null,
                    Search.SHOW_MISSING_PARAMETER, null,
                    Search.OFFSET_PARAMETER, null)).entrySet()) {
                String name = entry.getKey();

                for (String value : entry.getValue()) {
                    page.writeTag("input", "type", "hidden", "name", name, "value", value);
                }
            }

            page.writeStart("select", "name", Search.SORT_PARAMETER);
                for (Map.Entry<String, String> entry : search.findSorts().entrySet()) {
                    String label = entry.getValue();
                    String value = entry.getKey();

                    page.writeStart("option",
                            "value", value,
                            "selected", value.equals(search.getSort()) ? "selected" : null);
                        page.writeHtml("Sort: ").writeHtml(label);
                    page.writeEnd();
                }
            page.writeEnd();

            if (sortField != null) {
                page.writeHtml(" ");

                page.writeTag("input",
                        "id", page.createId(),
                        "type", "checkbox",
                        "name", Search.SHOW_MISSING_PARAMETER,
                        "value", "true",
                        "checked", search.isShowMissing() ? "checked" : null);

                page.writeHtml(" ");

                page.writeStart("label", "for", page.getId());
                    page.writeHtml("Show Missing");
                page.writeEnd();
            }

        page.writeEnd();
    }

    public void renderPagination() throws IOException {
        page.writeStart("ul", "class", "pagination");

            if (result.hasPrevious()) {
                page.writeStart("li", "class", "previous");
                    page.writeStart("a", "href", page.url("", Search.OFFSET_PARAMETER, result.getPreviousOffset()));
                        page.writeHtml("Previous ");
                        page.writeHtml(result.getLimit());
                    page.writeEnd();
                page.writeEnd();
            }

            page.writeStart("li");
                page.writeHtml(result.getFirstItemIndex());
                page.writeHtml(" to ");
                page.writeHtml(result.getLastItemIndex());
                page.writeHtml(" of ");
                page.writeStart("strong").writeHtml(result.getCount()).writeEnd();
            page.writeEnd();

            if (result.hasNext()) {
                page.writeStart("li", "class", "next");
                    page.writeStart("a", "href", page.url("", Search.OFFSET_PARAMETER, result.getNextOffset()));
                        page.writeHtml("Next ");
                        page.writeHtml(result.getLimit());
                    page.writeEnd();
                page.writeEnd();
            }

        page.writeEnd();
    }

    public void renderList(Collection<?> listItems) throws IOException {
        List<Object> items = new ArrayList<Object>(listItems);
        Map<Object, StorageItem> previews = new LinkedHashMap<Object, StorageItem>();
        Map<Object, StorageItem> videoPreviews = new LinkedHashMap<Object, StorageItem>();

        for (ListIterator<Object> i = items.listIterator(); i.hasNext(); ) {
            Object item = i.next();
            State itemState = State.getInstance(item);
            StorageItem preview = itemState.getPreview();

            if (preview != null) {
                String contentType = preview.getContentType();

                if (contentType != null && contentType.startsWith("image/")) {
                    i.remove();
                    previews.put(item, preview);
                }
                if (contentType != null && contentType.startsWith("video/")) {
                    i.remove();
                    videoPreviews.put(item, preview);
                }
            }
        }

        if (!previews.isEmpty()) {
            page.writeStart("div", "class", "searchResultImages");
                for (Map.Entry<Object, StorageItem> entry : previews.entrySet()) {
                    renderImage(entry.getKey(), entry.getValue());
                }
            page.writeEnd();
        }
        if (!videoPreviews.isEmpty()) {
            System.err.println("Rendering of video thumbs...");
            page.writeStart("div", "class", "searchResultImages");
                for (Map.Entry<Object, StorageItem> entry : videoPreviews.entrySet()) {
                    renderVideo(entry.getKey(), entry.getValue());
                }
            page.writeEnd();
        }
        if (!items.isEmpty()) {
            page.writeStart("table", "class", "searchResultTable links table-striped pageThumbnails");
                page.writeStart("tbody");
                    for (Object item : items) {
                        renderRow(item);
                    }
                page.writeEnd();
            page.writeEnd();
        }
    }

    public void renderImage(Object item, StorageItem image) throws IOException {
        String url = null;

        if (ImageEditor.Static.getDefault() != null) {
            url = new ImageTag.Builder(image).setHeight(100).toUrl();
        }

        if (url == null) {
            url = image.getPublicUrl();
        }

        renderBeforeItem(item);

        page.writeStart("figure");
            page.writeTag("img",
                    "alt", (showTypeLabel ? page.getTypeLabel(item) + ": " : "") + page.getObjectLabel(item),
                    "src", page.url(url));

            page.writeStart("figcaption");
                if (showTypeLabel) {
                    page.writeTypeLabel(item);
                    page.writeHtml(": ");
                }
                page.writeObjectLabel(item);
            page.writeEnd();
        page.writeEnd();

        renderAfterItem(item);
    }

    public void renderVideo(Object item, StorageItem video) throws IOException {
        String url=video.getPublicUrl();
        if (video instanceof VideoStorageItem) {
          url = ((VideoStorageItem)video).getThumbnailUrl();
        }
        renderBeforeItem(item);
        page.writeStart("figure");
            page.writeTag("img",
                    "alt", (showTypeLabel ? page.getTypeLabel(item) + ": " : "") + page.getObjectLabel(item),
                    "src", page.url(url));

            page.writeStart("figcaption");
                if (showTypeLabel) {
                    page.writeTypeLabel(item);
                    page.writeHtml(": ");
                }
                page.writeObjectLabel(item);
            page.writeEnd();
        page.writeEnd();

        renderAfterItem(item);
    }

    public void renderRow(Object item) throws IOException {
        HttpServletRequest request = page.getRequest();
        State itemState = State.getInstance(item);
        String permalink = itemState.as(Directory.ObjectModification.class).getPermalink();
        Integer embedWidth = null;

        if (ObjectUtils.isBlank(permalink)) {
            ObjectType type = itemState.getType();

            if (type != null) {
                Renderer.TypeModification rendererData = type.as(Renderer.TypeModification.class);
                int previewWidth = rendererData.getEmbedPreviewWidth();

                if (previewWidth > 0 &&
                        !ObjectUtils.isBlank(rendererData.getEmbedPath())) {
                    permalink = "/_preview?_embed=true&_cms.db.previewId=" + itemState.getId();
                    embedWidth = 320;
                }
            }
        }

        page.writeStart("tr",
                "data-preview-url", permalink,
                "data-preview-embed-width", embedWidth,
                "class", State.getInstance(item).getId().equals(page.param(UUID.class, "id")) ? "selected" : null);

            if (sortField != null &&
                    ObjectField.DATE_TYPE.equals(sortField.getInternalType())) {
                DateTime dateTime = page.toUserDateTime(itemState.get(sortField.getInternalName()));

                if (dateTime == null) {
                    page.writeStart("td", "colspan", 2);
                        page.writeHtml("N/A");
                    page.writeEnd();

                } else {
                    String date = page.formatUserDate(dateTime);

                    page.writeStart("td", "class", "date");
                        if (!ObjectUtils.equals(date, request.getAttribute(PREVIOUS_DATE_ATTRIBUTE))) {
                            request.setAttribute(PREVIOUS_DATE_ATTRIBUTE, date);
                            page.writeHtml(date);
                        }
                    page.writeEnd();

                    page.writeStart("td", "class", "time");
                        page.writeHtml(page.formatUserTime(dateTime));
                    page.writeEnd();
                }
            }

            if (showTypeLabel) {
                page.writeStart("td");
                    page.writeTypeLabel(item);
                page.writeEnd();
            }

            page.writeStart("td", "data-preview-anchor", "");
                renderBeforeItem(item);
                page.writeObjectLabel(item);
                renderAfterItem(item);
            page.writeEnd();

            if (sortField != null &&
                    !ObjectField.DATE_TYPE.equals(sortField.getInternalType())) {
                String sortFieldName = sortField.getInternalName();
                Object value = itemState.get(sortFieldName);

                page.writeStart("td");
                    if (value instanceof Metric) {
                        page.writeStart("span", "style", page.cssString("white-space", "nowrap"));
                            Double maxSum = (Double) request.getAttribute(MAX_SUM_ATTRIBUTE);

                            if (maxSum == null) {
                                Object maxObject = search.toQuery(page.getSite()).sortDescending(sortFieldName).first();
                                maxSum = maxObject != null ?
                                        ((Metric) State.getInstance(maxObject).get(sortFieldName)).getSum() :
                                        1.0;

                                request.setAttribute(MAX_SUM_ATTRIBUTE, maxSum);
                            }

                            Metric valueMetric = (Metric) value;
                            Map<DateTime, Double> sumEntries = valueMetric.groupSumByDate(
                                    new MetricInterval.Daily(),
                                    new DateTime().dayOfMonth().roundFloorCopy().minusDays(7),
                                    null);

                            double sum = valueMetric.getSum();
                            long sumLong = (long) sum;

                            if (sumLong == sum) {
                                page.writeHtml(String.format("%,2d ", sumLong));

                            } else {
                                page.writeHtml(String.format("%,2.2f ", sum));
                            }

                            if (!sumEntries.isEmpty()) {
                                long minMillis = Long.MAX_VALUE;
                                long maxMillis = Long.MIN_VALUE;

                                for (Map.Entry<DateTime, Double> sumEntry : sumEntries.entrySet()) {
                                    long sumMillis = sumEntry.getKey().getMillis();

                                    if (sumMillis < minMillis) {
                                        minMillis = sumMillis;
                                    }

                                    if (sumMillis > maxMillis) {
                                        maxMillis = sumMillis;
                                    }
                                }

                                double cumulativeSum = 0.0;
                                StringBuilder path = new StringBuilder();
                                double xRange = maxMillis - minMillis;
                                int width = 35;
                                int height = 18;

                                for (Map.Entry<DateTime, Double> sumEntry : sumEntries.entrySet()) {
                                    cumulativeSum += sumEntry.getValue();

                                    path.append('L');
                                    path.append((sumEntry.getKey().getMillis() - minMillis) / xRange * width);
                                    path.append(',');
                                    path.append(height - cumulativeSum / maxSum * height);
                                }

                                path.setCharAt(0, 'M');

                                page.writeStart("svg",
                                        "xmlns", "http://www.w3.org/2000/svg",
                                        "width", width,
                                        "height", height,
                                        "style", page.cssString(
                                                "display", "inline-block",
                                                "vertical-align", "middle"));
                                    page.writeStart("path",
                                            "fill", "none",
                                            "stroke", "#444444",
                                            "d", path.toString());
                                    page.writeEnd();
                                page.writeEnd();
                            }
                        page.writeEnd();

                    } else if (value instanceof Recordable) {
                        page.writeHtml(((Recordable) value).getState().getLabel());

                    } else {
                        page.writeHtml(value);
                    }
                page.writeEnd();
            }

        page.writeEnd();
    }

    public void renderBeforeItem(Object item) throws IOException {
        page.writeStart("a",
                "href", page.objectUrl("/content/edit.jsp", item, "search", page.url("", Search.NAME_PARAMETER, null)),
                "data-objectId", State.getInstance(item).getId(),
                "target", "_top");
    }

    public void renderAfterItem(Object item) throws IOException {
        page.writeEnd();
    }

    public void renderEmpty() throws IOException {
        page.writeStart("div", "class", "message message-warning");
            page.writeStart("p");
                page.writeHtml("No matching items!");
            page.writeEnd();
        page.writeEnd();
    }
}
