package com.psddev.cms.tool.page;

import java.io.IOException;
import java.lang.annotation.Annotation;
import java.lang.reflect.AnnotatedElement;
import java.lang.reflect.Array;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import javax.servlet.ServletException;

import com.psddev.cms.db.Content;
import com.psddev.cms.db.Directory;
import com.psddev.cms.db.Renderer;
import com.psddev.cms.db.ToolUser;
import com.psddev.cms.tool.CmsTool;
import com.psddev.cms.tool.PageServlet;
import com.psddev.cms.tool.ToolPageContext;
import com.psddev.dari.db.Application;
import com.psddev.dari.db.ObjectField;
import com.psddev.dari.db.ObjectType;
import com.psddev.dari.db.Query;
import com.psddev.dari.db.State;
import com.psddev.dari.util.ClassFinder;
import com.psddev.dari.util.DebugFilter;
import com.psddev.dari.util.ObjectUtils;
import com.psddev.dari.util.RoutingFilter;
import com.psddev.dari.util.StringUtils;

@RoutingFilter.Path(application = "cms", value = "contentTools")
@SuppressWarnings("serial")
public class ContentTools extends PageServlet {

    @Override
    protected String getPermissionId() {
        return null;
    }

    @Override
    protected void doService(ToolPageContext page) throws IOException, ServletException {
        Object object = Query.from(Object.class).where("_id = ?", page.param(UUID.class, "id")).first();
        State state = State.getInstance(object);
        String returnUrl = page.param(String.class, "returnUrl");

        page.writeHeader();
            page.writeStart("div", "class", "widget");
                page.writeStart("h1", "class", "icon icon-wrench");
                    page.writeHtml("Tools");
                page.writeEnd();

                page.writeStart("div", "class", "tabbed");
                    page.writeStart("div",
                            "class", "fixedScrollable",
                            "data-tab", "For Editors");
                        if (object != null) {
                            Content.ObjectModification contentData = state.as(Content.ObjectModification.class);
                            Date publishDate = contentData.getPublishDate();
                            ToolUser publishUser = contentData.getPublishUser();
                            Date updateDate = contentData.getUpdateDate();
                            ToolUser updateUser = contentData.getUpdateUser();

                            page.writeStart("ul");
                                if (publishDate != null || publishUser != null) {
                                    page.writeStart("li");
                                        page.writeHtml("Published: ");

                                        if (publishDate != null) {
                                            page.writeHtml(page.formatUserDateTime(publishDate));
                                        }

                                        if (publishUser != null) {
                                            page.writeHtml(publishDate != null ? " by " : "By ");
                                            page.writeObjectLabel(updateUser);
                                        }
                                    page.writeEnd();
                                }

                                if (updateDate != null || updateUser != null) {
                                    page.writeStart("li");
                                        page.writeHtml("Last Updated: ");

                                        if (updateDate != null) {
                                            page.writeHtml(page.formatUserDateTime(updateDate));
                                        }

                                        if (updateUser != null) {
                                            page.writeHtml(updateDate != null ? " by " : "By ");
                                            page.writeObjectLabel(updateUser);
                                        }
                                    page.writeEnd();
                                }
                            page.writeEnd();
                        }
                    page.writeEnd();

                    page.writeStart("div",
                            "class", "fixedScrollable",
                            "data-tab", "For Developers");
                        page.writeStart("ul");
                            if (object != null) {
                                page.writeStart("li");
                                    page.writeStart("a",
                                            "target", "_blank",
                                            "href", page.objectUrl("/contentRaw", object));
                                        page.writeHtml("View Raw Data");
                                    page.writeEnd();
                                page.writeEnd();
                            }

                            if (!ObjectUtils.isBlank(returnUrl)) {
                                page.writeStart("li");
                                    if (ObjectUtils.to(boolean.class, StringUtils.getQueryParameterValue(returnUrl, "deprecated"))) {
                                        page.writeStart("a",
                                                "target", "_top",
                                                "href", StringUtils.addQueryParameters(returnUrl,
                                                        "deprecated", null));
                                            page.writeHtml("Hide Deprecated Fields");
                                        page.writeEnd();

                                    } else {
                                        page.writeStart("a",
                                                "target", "_top",
                                                "href", StringUtils.addQueryParameters(returnUrl,
                                                        "deprecated", true));
                                            page.writeHtml("Show Deprecated Fields");
                                        page.writeEnd();
                                    }
                                page.writeEnd();
                            }

                            if (object != null) {
                                ObjectType type = state.getType();

                                if (type != null) {
                                    Class<?> objectClass = type.getObjectClass();

                                    page.writeStart("li");
                                        page.writeHtml("Class: ");
                                        page.writeJavaClassLink(objectClass);
                                    page.writeEnd();
                                }

                                page.writeStart("li");
                                    page.writeStart("label");
                                        page.writeHtml("ID: ");

                                        page.writeTag("input",
                                                "type", "text",
                                                "class", "code",
                                                "value", state.getId(),
                                                "readonly", "readonly",
                                                "style", "width:290px;",
                                                "onclick", "this.select();");
                                    page.writeEnd();
                                page.writeEnd();
                            }
                        page.writeEnd();

                        if (object != null) {
                            ObjectType type = state.getType();

                            if (type != null) {
                                if (!ObjectUtils.isBlank(type.as(Renderer.TypeModification.class).getEmbedPath())) {
                                    String permalink = state.as(Directory.ObjectModification.class).getPermalink();

                                    if (!ObjectUtils.isBlank(permalink)) {
                                        String siteUrl = Application.Static.getInstance(CmsTool.class).getDefaultSiteUrl();
                                        StringBuilder embedCode = new StringBuilder();

                                        embedCode.append("<script type=\"text/javascript\" src=\"");
                                        embedCode.append(StringUtils.addQueryParameters(
                                                StringUtils.removeEnd(siteUrl, "/") + permalink,
                                                "_embed", true,
                                                "_format", "js"));
                                        embedCode.append("\"></script>");

                                        page.writeHtml("Embed Code:");
                                        page.writeTag("br");
                                        page.writeStart("textarea",
                                                "class", "code",
                                                "data-expandable-class", "code",
                                                "readonly", "readonly",
                                                "onclick", "this.select();");
                                            page.writeHtml(embedCode);
                                        page.writeEnd();
                                    }
                                }

                                String defaultPath = type.as(Renderer.TypeModification.class).getPath();
                                Map<String, String> paths = type.as(Renderer.TypeModification.class).getPaths();

                                if (!ObjectUtils.isBlank(defaultPath) || !ObjectUtils.isBlank(paths)) {
                                    page.writeStart("h2");
                                        page.writeHtml("Renderers");
                                    page.writeEnd();

                                    page.writeStart("ul");
                                        if (!ObjectUtils.isBlank(defaultPath)) {
                                            page.writeStart("li");
                                                page.writeStart("code");
                                                    page.writeHtml("Default: ");

                                                    page.writeStart("a",
                                                            "target", "_blank",
                                                            "href", DebugFilter.Static.getServletPath(page.getRequest(), "code",
                                                                    "action", "edit",
                                                                    "type", "JSP",
                                                                    "servletPath", defaultPath));
                                                        page.writeHtml(defaultPath);
                                                    page.writeEnd();
                                                page.writeEnd();
                                            page.writeEnd();
                                        }

                                        for (Map.Entry<String, String> entry : paths.entrySet()) {
                                            page.writeStart("li");
                                                page.writeStart("code");
                                                    page.writeHtml(entry.getKey());
                                                    page.writeHtml(": ");

                                                    page.writeStart("a",
                                                            "target", "_blank",
                                                            "href", DebugFilter.Static.getServletPath(page.getRequest(), "code",
                                                                    "action", "edit",
                                                                    "type", "JSP",
                                                                    "servletPath", entry.getValue()));
                                                        page.writeHtml(entry.getValue());
                                                    page.writeEnd();
                                                page.writeEnd();
                                            page.writeEnd();
                                        }
                                    page.writeEnd();
                                }

                                Class<?> objectClass = type.getObjectClass();

                                if (objectClass != null) {
                                    Static.writeJavaAnnotationDescriptions(page, objectClass);
                                }
                            }
                        }
                    page.writeEnd();
                page.writeEnd();
            page.writeEnd();
        page.writeFooter();
    }

    /**
     * {@link ContentTools} utility methods.
     */
    public static class Static {

        public static void writeJavaAnnotationDescriptions(
                ToolPageContext page,
                AnnotatedElement annotated)
                throws IOException {

            List<Annotation> presentAnnotations = Arrays.asList(annotated.getAnnotations());
            List<Class<? extends Annotation>> possibleAnnotationClasses = new ArrayList<Class<? extends Annotation>>();

            for (Class<? extends Annotation> ac : ClassFinder.Static.findClasses(Annotation.class)) {
                if (!ac.isAnnotationPresent(Deprecated.class) &&
                        ac.isAnnotationPresent(annotated instanceof Field ?
                                ObjectField.AnnotationProcessorClass.class :
                                ObjectType.AnnotationProcessorClass.class)) {
                    possibleAnnotationClasses.add(ac);
                    continue;
                }
            }

            Collections.sort(possibleAnnotationClasses, new Comparator<Class<? extends Annotation>>() {

                @Override
                public int compare(Class<? extends Annotation> x, Class<? extends Annotation> y) {
                    return x.getName().compareTo(y.getName());
                }
            });

            if (!presentAnnotations.isEmpty()) {
                page.writeStart("h2");
                    page.writeHtml("Present Annotations");
                page.writeEnd();

                page.writeStart("ul");
                    for (Annotation a : presentAnnotations) {
                        page.writeStart("li");
                            writeJavaAnnotationDescription(page, a);
                        page.writeEnd();
                    }
                page.writeEnd();
            }

            page.writeStart("h2");
                page.writeHtml("Possible Annotations");
            page.writeEnd();

            page.writeStart("ul");
                for (Class<? extends Annotation> ac : possibleAnnotationClasses) {
                    page.writeStart("li");
                        page.writeJavaClassLink(ac);
                    page.writeEnd();
                }
            page.writeEnd();
        }

        private static void writeJavaAnnotationDescription(
                ToolPageContext page,
                Annotation annotation)
                throws IOException {

            Class<? extends Annotation> aClass = annotation.annotationType();

            page.writeJavaClassLink(aClass);

            List<Method> aMethods = new ArrayList<Method>(Arrays.asList(aClass.getMethods()));

            for (Iterator<Method> i = aMethods.iterator(); i.hasNext(); ) {
                if (!i.next().getDeclaringClass().equals(aClass)) {
                    i.remove();
                }
            }

            if (!aMethods.isEmpty()) {
                page.writeStart("ul");
                    for (Method m : aMethods) {
                        if (m.getDeclaringClass().equals(aClass)) {
                            page.writeStart("li");
                                page.writeStart("code");
                                    page.writeHtml(m.getName());
                                    page.writeHtml(": ");

                                    try {
                                        writeJavaAnnotationValue(page, m.invoke(annotation));
                                    } catch (IllegalAccessException error) {
                                    } catch (InvocationTargetException error) {
                                    }
                                page.writeEnd();
                            page.writeEnd();
                        }
                    }
                page.writeEnd();
            }
        }

        public static void writeJavaAnnotationValue(
                ToolPageContext page,
                Object value)
                throws IOException {

            if (value instanceof String) {
                page.writeHtml('"');
                page.writeHtml(value);
                page.writeHtml('"');

            } else if (value instanceof Class) {
                page.writeJavaClassLink((Class<?>) value);

            } else if (value instanceof Annotation) {
                writeJavaAnnotationDescription(page, (Annotation) value);

            } else if (value.getClass().isArray()) {
                int length = Array.getLength(value);

                if (length == 0) {
                    page.writeHtml("[]");

                } else {
                    page.writeStart("ul");
                        for (int i = 0; i < length; ++ i) {
                            page.writeStart("li");
                                writeJavaAnnotationValue(page, Array.get(value, i));
                            page.writeEnd();
                        }
                    page.writeEnd();
                }

            } else {
                page.writeHtml(value);
            }
        }
    }
}
