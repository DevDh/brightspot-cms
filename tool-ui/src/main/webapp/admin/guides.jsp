<%@ page
	import="
	com.psddev.cms.db.Guide,
	com.psddev.cms.db.GuideType,
	com.psddev.cms.db.Page,
	com.psddev.cms.db.Section,
	com.psddev.cms.db.Template,
	com.psddev.cms.tool.ToolPageContext,
	com.psddev.dari.db.Query,
	com.psddev.dari.db.State,
	java.util.ArrayList,
	java.util.List
	"%>
<%

// --- Logic ---

ToolPageContext wp = new ToolPageContext(pageContext);
if (wp.requirePermission("area/admin/adminGuides")) {
    return;
}

Object selected = wp.findOrReserve(Guide.class, Page.class, Template.class, GuideType.class);
Class<?> selectedClass = selected.getClass();
State selectedState = State.getInstance(selected);

if (wp.include("/WEB-INF/updateObject.jsp", "object", selected)) {
    return;
}

List<Guide> guides = Query.from(Guide.class).sortAscending("title").select();
List<GuideType> typeGuides = Query.from(GuideType.class).sortAscending("documentedType").select();
List<Page> templates = Query.from(Page.class).sortAscending("name").select();
List<Page> referencedTemplates = new ArrayList<Page>();
List<Section> referencedSections = new ArrayList<Section>();




// --- Presentation ---

%>
<% wp.include("/WEB-INF/header.jsp"); %>

<div class="withLeftNav">
	<div class="leftNav">
		<div class="widget">

			<h1>Guides</h1>

			<h2>Guides</h2>
			<ul class="links">
				<li
					class="new<%= selectedClass == Guide.class && selectedState.isNew() ? " selected" : "" %>">
					<a href="<%= wp.typeUrl(null, Guide.class) %>">New Guide</a>
				</li>
				<% for (Guide guide : guides) { %>
				<li <%= guide.equals(selected) ? " class=\"selected\"" : "" %>>
					<a href="<%= wp.objectUrl(null, guide) %>"><%= wp.objectLabel(guide) %></a>
				</li>
				<% // Record which templates are referenced by this guide
                       if (guide.getTemplatesToIncludeInGuide() != null) {
                	       for (Page template : guide.getTemplatesToIncludeInGuide()) {
                		       referencedTemplates.add(template);               		       
                	       }
                       }
                   } %>
			</ul>

			<h2>Content Type Guides</h2>
			<ul class="links">
				<li
					class="new<%= selectedClass == GuideType.class && selectedState.isNew() ? " selected" : "" %>">
					<a href="<%= wp.typeUrl(null, GuideType.class) %>">New Guide</a>
				</li>
				<% for (GuideType guide : typeGuides) { %>
				<li <%= guide.equals(selected) ? " class=\"selected\"" : "" %>>
					<a href="<%= wp.objectUrl(null, guide) %>"><%= wp.objectLabel(guide) %></a>
				</li> 
				<% } %>
			</ul>

		</div>
	</div>
	<div class="main">

		<div class="widget">
			<% wp.include("/WEB-INF/editObject.jsp", "object", selected); %>
		</div>

	</div>
</div>

<% wp.include("/WEB-INF/footer.jsp"); %>
